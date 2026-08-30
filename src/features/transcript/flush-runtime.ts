import {
  getDb,
  insertSession,
  insertTranscriptSegments,
} from '@/lib/db'
import { getSelectedHotwordPackId } from '@/lib/providers/asr'

import { readAsrRuntimeConfig } from './asr-config'
import {
  createTranscriptFlusher,
  overflowStorageKey,
  type FlushSegment,
} from './flush'

function writeOverflow(sessionId: string, rows: readonly FlushSegment[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(overflowStorageKey(sessionId), JSON.stringify(rows))
  } catch {
    // quota: keep going; recording must not stop
  }
}

async function persistBatch(
  sessionId: string,
  rows: readonly FlushSegment[],
): Promise<number> {
  const db = await getDb()
  return insertTranscriptSegments(
    db,
    rows.map((row) => ({
      id: row.id,
      sessionId,
      seq: row.seq,
      startMs: row.startMs,
      endMs: row.endMs,
      text: row.text,
    })),
  )
}

export const transcriptFlusher = createTranscriptFlusher({
  persist: persistBatch,
  overflow: writeOverflow,
})

export async function persistRecordingSession(sessionId: string): Promise<void> {
  const config = readAsrRuntimeConfig()
  const db = await getDb()
  await insertSession(db, {
    id: sessionId,
    title: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' 课堂',
    status: 'recording',
    asrSnapshot: {
      family: config.family,
      dialect: config.dialect ?? '',
      model: config.model,
      baseUrl: config.baseUrl,
      sampleRate: config.sampleRate,
      hotwordPack: getSelectedHotwordPackId(),
    },
  })
}
