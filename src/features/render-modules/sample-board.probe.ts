import { resolveRenderView } from './dispatch'
import type { RenderModuleRegistry } from './manifest'
import { richTextPropsSchema } from './rich-text/schema'
import type { RenderMessage } from './types'

const registry = {
  'rich-text': {
    name: 'rich-text',
    version: '1.0',
    toolName: 'render_rich_text',
    description: 'probe',
    propsSchema: richTextPropsSchema,
    Component: () => null,
  },
} as RenderModuleRegistry

function sample(id: string, props: unknown): RenderMessage {
  return {
    id,
    module: 'rich-text',
    version: '1.0',
    target: 'notes',
    props,
    meta: { createdAt: 1, source: 'system' },
  }
}

export function readSampleBoardHasSuccessAndError(): string {
  const ok = resolveRenderView(sample('ok', { markdown: 'ok' }), registry)
  const bad = resolveRenderView(sample('bad', { nope: true }), registry)
  if (!ok.ok) throw new Error('valid sample must render')
  if (bad.ok) throw new Error('invalid props must fail closed to error card')
  return `crp-samples:ok=1;error=1`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/sample-board.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readSampleBoardHasSuccessAndError()}\n`)
}
