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

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/pipeline.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readPartialStaysPrivate()}\n`)
}
