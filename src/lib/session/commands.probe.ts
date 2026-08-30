import { publishCommand, resetCommandBus, subscribeCommands } from './commands'
import { getRenderMessages } from './reads/render'
import type { SessionCommand } from './types'
import { P0_SESSION_COMMAND_TYPES } from './types'
import {
  resetRenderProjection,
  revokeRenderMessage,
  upsertRenderMessage,
} from './writes/render'

const sampleCommands: SessionCommand[] = [
  { type: 'transcript.scrollTo', segmentId: 'seg-1', source: 'notes' },
  { type: 'transcript.highlight', segmentId: 'seg-1', source: 'agent' },
  { type: 'asr.configChanged', source: 'settings' },
  { type: 'ai.configChanged', source: 'settings' },
  { type: 'session.reset', reason: 'user' },
]

export function readCommandBusIsolation(): string {
  resetCommandBus()
  const seen: string[] = []
  const stopThrowing = subscribeCommands(() => {
    throw new Error('boom')
  })
  const stopRecording = subscribeCommands((command) => {
    seen.push(command.type)
  })

  for (const command of sampleCommands) {
    publishCommand(command)
  }
  stopThrowing()
  stopRecording()

  const missing = P0_SESSION_COMMAND_TYPES.filter(
    (type) => !seen.includes(type),
  )
  if (missing.length > 0) {
    throw new Error(`handlers missed ${missing.join(',')}`)
  }
  return `commands:${seen.join(',')}`
}

export function readRenderProjectionDiscipline(): string {
  resetRenderProjection()
  upsertRenderMessage({
    id: 'card-1',
    module: 'rich-text',
    version: '1.0',
    target: 'notes',
    props: { body: 'first' },
    meta: { createdAt: 1, source: 'system' },
  })
  upsertRenderMessage({
    id: 'card-2',
    module: 'image',
    version: '1.0',
    target: 'transcript',
    props: { src: 'x' },
    meta: { createdAt: 2, source: 'silent-agent' },
  })
  upsertRenderMessage({
    id: 'card-1',
    module: 'rich-text',
    version: '1.0',
    target: 'notes',
    props: { body: 'updated' },
    meta: { createdAt: 3, source: 'system' },
  })

  const notes = getRenderMessages('notes')
  if (notes.length !== 1 || notes[0]?.id !== 'card-1') {
    throw new Error('notes target list wrong')
  }
  if (JSON.stringify(notes[0]?.props) !== '{"body":"updated"}') {
    throw new Error('upsert did not replace same id')
  }
  revokeRenderMessage('card-2')
  if (getRenderMessages('transcript').length !== 0) {
    throw new Error('revoke did not drop transcript card')
  }
  resetRenderProjection()
  return 'render:upsert-revoke-ok'
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/commands.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(
    `${readCommandBusIsolation()}\n${readRenderProjectionDiscipline()}\n`,
  )
}
