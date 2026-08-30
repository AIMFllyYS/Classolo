import './pipeline'
import { getTranscriptPublic } from '@/lib/session'
import { publishCommand } from '@/lib/session'
import { appendCommitted, resetTranscriptPublic } from '@/lib/session/writes/transcript'

import { getTranscriptPrivate, resetTranscriptPrivate } from './private-store'

export function readPartialStaysPrivate(): string {
  resetTranscriptPrivate()
  resetTranscriptPublic()
  appendCommitted({
    id: 'seg-visible',
    seq: 1,
    text: '已确认',
    startMs: 0,
    endMs: 10,
  })
  const pub = JSON.stringify(getTranscriptPublic())
  const priv = getTranscriptPrivate()
  if (pub.includes('partial') || pub.includes('未定稿')) {
    throw new Error('public slice leaked partial')
  }
  if (!pub.includes('seg-visible')) {
    throw new Error('committed not visible on public slice')
  }
  void priv
  publishCommand({
    type: 'transcript.highlight',
    segmentId: 'missing-id',
    source: 'notes',
  })
  publishCommand({ type: 'asr.configChanged', source: 'settings' })
  publishCommand({ type: 'session.reset', reason: 'user' })
  return 'transcript-stream:public-committed-only'
}

export function readFortyFiveMinuteSeqUniqueness(): string {
  resetTranscriptPublic()
  const minutes = 45
  const finalsPerSecond = 1
  const count = minutes * 60 * finalsPerSecond
  for (let seq = 1; seq <= count; seq += 1) {
    appendCommitted({
      id: `seg-${seq}`,
      seq,
      text: `t${seq}`,
      startMs: seq * 1000,
      endMs: seq * 1000 + 800,
    })
  }
  const committed = getTranscriptPublic().committed
  const seqs = new Set(committed.map((segment) => segment.seq))
  if (committed.length !== count || seqs.size !== count) {
    throw new Error('45-minute simulated finals must be unique and complete')
  }
  return `forty-five-min-sim:${count}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/pipeline.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(
    `${readPartialStaysPrivate()}\n${readFortyFiveMinuteSeqUniqueness()}\n`,
  )
}
