import { searchTranscriptSnapshot } from './search-transcript'

export function readTranscriptKeywordHits(): string {
  const hits = searchTranscriptSnapshot('惯性', [
    {
      id: 'seg-inertia',
      seq: 3,
      text: '牛顿第一定律也叫惯性定律',
      startMs: 0,
      endMs: 1,
    },
    {
      id: 'seg-weather',
      seq: 4,
      text: '今天天气不错',
      startMs: 1,
      endMs: 2,
    },
  ])
  if (hits.length !== 1 || hits[0]?.segmentId !== 'seg-inertia') {
    throw new Error('keyword search must hit the real committed segment')
  }
  if (!hits[0]?.text.includes('惯性')) {
    throw new Error('hit text must come from the snapshot, not a canned reply')
  }
  const empty = searchTranscriptSnapshot('   ', [
    {
      id: 'seg-inertia',
      seq: 3,
      text: '牛顿第一定律也叫惯性定律',
      startMs: 0,
      endMs: 1,
    },
  ])
  if (empty.length !== 0) {
    throw new Error('blank query must not invent hits')
  }
  return `transcript-search:hits=${hits.length};id=${hits[0].segmentId}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/search-transcript.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readTranscriptKeywordHits()}\n`)
}
