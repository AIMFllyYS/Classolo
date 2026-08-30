import { subscribeCommands } from '@/lib/session'
import { resetCommandBus } from '@/lib/session/commands'

import { publishOutlineJump } from './jump'

export function readOutlineJumpPublishesScrollTo(): string {
  resetCommandBus()
  const seen: string[] = []
  const stop = subscribeCommands((command) => {
    if (command.type === 'transcript.scrollTo') {
      seen.push(command.segmentId)
    }
  })
  publishOutlineJump('seg-inertia')
  stop()
  if (seen.length !== 1 || seen[0] !== 'seg-inertia') {
    throw new Error('click must publish transcript.scrollTo with segmentId')
  }
  return `notes-jump:segment=${seen[0]}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/jump.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readOutlineJumpPublishesScrollTo()}\n`)
}
