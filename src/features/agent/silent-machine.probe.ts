import { getNotesPublic, getTranscriptPublic } from '@/lib/session'

import {
  getSilentAgentPrivateState,
  resetSilentAgentPrivateState,
  startSilentAgent,
} from './silent-machine'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function readSilentAgentThrottlesBySegment(): Promise<string> {
  resetSilentAgentPrivateState()
  let count = 0
  let version = 0
  const listeners: Array<() => void> = []
  const stop = startSilentAgent({
    debounceMs: 20,
    minNewSegments: 3,
    subscribeCommitted: (onCommitted) => {
      listeners.push(onCommitted)
      return () => {
        const index = listeners.indexOf(onCommitted)
        if (index >= 0) listeners.splice(index, 1)
      }
    },
    readCommittedCount: () => count,
    readCommittedVersion: () => version,
    readOutlineVersion: () => 2,
    onTick: () => undefined,
  })

  version = 1
  count = 1
  for (const listener of listeners) listener()
  version = 2
  count = 2
  for (const listener of listeners) listener()
  await delay(50)
  if (getSilentAgentPrivateState().ticks !== 0) {
    throw new Error('must not tick on every final / short burst')
  }

  version = 5
  count = 5
  for (const listener of listeners) listener()
  await delay(50)
  stop()
  const state = getSilentAgentPrivateState()
  if (state.ticks !== 1) {
    throw new Error(`expected 1 semantic tick, got ${state.ticks}`)
  }
  const pub = `${JSON.stringify(getNotesPublic())}${JSON.stringify(getTranscriptPublic())}`
  if (pub.includes('thinking') || pub.includes('"ticks"')) {
    throw new Error('silent agent private state leaked into public slices')
  }
  if (pub.includes('cs_') || pub.includes('apiKey')) {
    throw new Error('agent must not touch cs_ tables or secrets')
  }
  return `silent-agent:ticks=${state.ticks};status=${state.status}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/silent-machine.probe.ts',
)
if (invokedDirectly) {
  void readSilentAgentThrottlesBySegment().then((line) => {
    process.stdout.write(`${line}\n`)
  })
}
