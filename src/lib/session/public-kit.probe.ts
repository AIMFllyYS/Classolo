import { sessionPublicKit } from './public-kit'
import { appendCommitted, resetTranscriptPublic } from './writes/transcript'

export function readSessionSliceDiscipline(): string {
  resetTranscriptPublic()
  const before = sessionPublicKit.getTranscriptPublic()
  if (before.committedVersion !== 0 || before.committed.length !== 0) {
    throw new Error('transcript public slice did not reset')
  }

  let seenVersion = before.committedVersion
  const unsubscribe = sessionPublicKit.subscribeTranscriptPublic(
    (state) => state.committedVersion,
    (version) => {
      seenVersion = version
    },
  )

  appendCommitted({
    id: 'seg-1',
    seq: 1,
    text: '老师开始讲牛顿第一定律',
    startMs: 0,
    endMs: 1200,
  })
  unsubscribe()

  const after = sessionPublicKit.getTranscriptPublic()
  if (after.committedVersion !== 1 || seenVersion !== 1) {
    throw new Error('non-React subscribe did not observe committedVersion')
  }
  if (after.latestCommittedId !== 'seg-1' || after.committed[0]?.text === undefined) {
    throw new Error('appendCommitted did not project the final segment')
  }

  const snapshot = JSON.stringify({
    transcript: after,
    notes: sessionPublicKit.getNotesPublic(),
    settings: sessionPublicKit.getSettingsPublic(),
  })
  if (
    snapshot.includes('apiKey') ||
    snapshot.includes('api_key') ||
    snapshot.includes('partial')
  ) {
    throw new Error('public slices must not carry keys or partial text')
  }

  resetTranscriptPublic()
  return `session-public-kit: version=${after.committedVersion} id=${after.latestCommittedId}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/public-kit.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readSessionSliceDiscipline()}\n`)
}
