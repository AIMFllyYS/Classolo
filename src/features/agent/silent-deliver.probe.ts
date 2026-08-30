import { getRenderMessages } from '@/lib/session'
import { resetRenderProjection } from '@/lib/session/writes/render'

import { deliverSilentRender, SILENT_RENDER_ID } from './silent-deliver'
import {
  resetSilentAgentPrivateState,
  startSilentAgent,
} from './silent-machine'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function readSilentDeliverUpdatesSameId(): Promise<string> {
  resetRenderProjection()
  resetSilentAgentPrivateState()
  let count = 0
  let version = 0
  const listeners: Array<() => void> = []
  const stop = startSilentAgent({
    debounceMs: 15,
    minNewSegments: 3,
    subscribeCommitted: (onCommitted) => {
      listeners.push(onCommitted)
      return () => undefined
    },
    readCommittedCount: () => count,
    readCommittedVersion: () => version,
    readOutlineVersion: () => 0,
  })
  version = 4
  count = 4
  for (const listener of listeners) listener()
  await delay(40)
  const first = getRenderMessages('notes')
  if (first.length !== 1 || first[0]?.id !== SILENT_RENDER_ID) {
    throw new Error('silent path must project one notes card')
  }
  if (first[0]?.meta.source !== 'silent-agent') {
    throw new Error('meta.source must be silent-agent')
  }
  if (first[0]?.module !== 'rich-text') {
    throw new Error('must use an existing CRP module name without importing it')
  }
  version = 8
  count = 8
  for (const listener of listeners) listener()
  await delay(40)
  stop()
  const second = getRenderMessages('notes')
  if (second.length !== 1 || second[0]?.id !== SILENT_RENDER_ID) {
    throw new Error('repeat ticks must update the same id, not stack cards')
  }
  return `silent-crp:cards=${second.length};id=${second[0]?.id}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/silent-deliver.probe.ts',
)
if (invokedDirectly) {
  void readSilentDeliverUpdatesSameId().then((line) => {
    process.stdout.write(`${line}\n`)
  })
}
