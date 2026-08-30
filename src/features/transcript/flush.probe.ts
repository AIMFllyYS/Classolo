import {
  insertSession,
  insertTranscriptSegments,
  listTranscriptSegments,
  openDatabase,
} from '@/lib/db'

import {
  createTranscriptFlusher,
  FLUSH_SEGMENT_COUNT,
  mergeForFlush,
  type FlushSegment,
} from './flush'

function seg(
  seq: number,
  text: string,
  startMs: number,
  endMs: number,
): FlushSegment {
  return {
    id: `id-${seq}`,
    seq,
    text,
    startMs,
    endMs,
  }
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  )
  return sorted[index] ?? 0
}

export async function readTranscriptFlushAndBench(): Promise<string> {
  const merged = mergeForFlush([
    seg(0, '短', 0, 80),
    seg(1, '后续', 100, 400),
    seg(2, '独立长段落不会被合并', 2000, 2600),
  ])
  if (merged.length !== 2 || merged[0]?.text !== '短后续') {
    throw new Error('short adjacent finals must merge before flush')
  }

  const persisted: FlushSegment[][] = []
  const flusher = createTranscriptFlusher({
    persist: async (_sessionId, rows) => {
      persisted.push([...rows])
      return rows.length
    },
    sleep: async () => undefined,
  })
  flusher.attach('session-a')
  for (let i = 0; i < FLUSH_SEGMENT_COUNT - 1; i += 1) {
    flusher.enqueue(seg(i, `t${i}`, i * 1000, i * 1000 + 400))
  }
  if (await flusher.flush(false)) {
    throw new Error('19 segments must not flush')
  }
  flusher.enqueue(seg(19, 't19', 19000, 19400))
  if (!(await flusher.flush(false))) {
    throw new Error('20 segments must flush')
  }
  if (persisted.length !== 1 || persisted[0]?.length !== 20) {
    throw new Error('batch size must follow the 20-segment threshold')
  }

  let calls = 0
  const failing = createTranscriptFlusher({
    persist: async () => {
      calls += 1
      throw new Error('disk full')
    },
    overflow: (sessionId, rows) => {
      if (sessionId !== 'session-b' || rows.length === 0) {
        throw new Error('overflow must keep the failed batch')
      }
    },
    sleep: async () => undefined,
  })
  failing.attach('session-b')
  failing.enqueue(seg(0, 'keep', 0, 10))
  const ok = await failing.flush(true)
  if (ok || calls !== 4) {
    throw new Error('failed flush must retry 3 times then overflow, not throw')
  }

  const db = await openDatabase()
  const session = await insertSession(db, {
    title: 'flush bench',
    status: 'recording',
    asrSnapshot: {
      family: 'realtime-ws',
      dialect: 'stepfun',
      model: 'stepaudio-2.5-asr-stream',
      baseUrl: 'wss://example.invalid',
      sampleRate: 16000,
    },
  })
  const times: number[] = []
  const total = 1800
  const started = Date.now()
  for (let i = 0; i < total; i += FLUSH_SEGMENT_COUNT) {
    const batch: FlushSegment[] = []
    for (let j = 0; j < FLUSH_SEGMENT_COUNT; j += 1) {
      const seq = i + j
      batch.push({
        id: crypto.randomUUID(),
        seq,
        text: `段${seq} 课堂转写`,
        startMs: seq * 3000,
        endMs: seq * 3000 + 800,
      })
    }
    const t0 = Date.now()
    await insertTranscriptSegments(
      db,
      batch.map((row) => ({
        id: row.id,
        sessionId: session.id,
        seq: row.seq,
        startMs: row.startMs,
        endMs: row.endMs,
        text: row.text,
      })),
    )
    times.push(Date.now() - t0)
  }
  const replay = await insertTranscriptSegments(
    db,
    [
      {
        id: crypto.randomUUID(),
        sessionId: session.id,
        seq: 0,
        startMs: 0,
        endMs: 1,
        text: 'dup',
      },
    ],
  )
  if (replay !== 0) throw new Error('bench duplicate seq must do nothing')
  const stored = await listTranscriptSegments(db, session.id)
  if (stored.length !== total) {
    throw new Error(`expected ${total} stored rows, got ${stored.length}`)
  }
  const elapsed = Date.now() - started
  const p95 = percentile(times, 95)
  const max = Math.max(...times)
  await db.$client.close()
  return `flush:batch=20;rows=${stored.length};p95=${p95}ms;max=${max}ms;total=${elapsed}ms`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/flush.probe.ts',
)
if (invokedDirectly) {
  void readTranscriptFlushAndBench().then((line) => {
    process.stdout.write(`${line}\n`)
  })
}
