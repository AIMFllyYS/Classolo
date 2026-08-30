import { resolveRenderView } from './dispatch'
import type { RenderModuleRegistry } from './manifest'
import { agentStatusModule } from './agent-status/manifest'
import { aiAskModule } from './ai-ask/manifest'

export function readStatusAndAskDispatch(): string {
  const registry = {
    'agent-status': agentStatusModule,
    'ai-ask': aiAskModule,
  } as RenderModuleRegistry
  const status = resolveRenderView(
    {
      id: 'st-1',
      module: 'agent-status',
      version: '1.0',
      target: 'notes',
      props: { status: 'thinking', detail: '整理提纲' },
      meta: { createdAt: 1, source: 'silent-agent' },
    },
    registry,
  )
  const ask = resolveRenderView(
    {
      id: 'ask-1',
      module: 'ai-ask',
      version: '1.0',
      target: 'transcript',
      props: { question: '惯性是什么？', choices: ['质量', '阻力'] },
      meta: { createdAt: 1, source: 'silent-agent' },
    },
    registry,
  )
  const bad = resolveRenderView(
    {
      id: 'ask-bad',
      module: 'ai-ask',
      version: '1.0',
      target: 'transcript',
      props: { question: 1 },
      meta: { createdAt: 1, source: 'system' },
    },
    registry,
  )
  if (!status.ok || !ask.ok || bad.ok) {
    throw new Error('status/ask must dispatch valid props and reject illegal ones')
  }
  if (agentStatusModule.toolName === aiAskModule.toolName) {
    throw new Error('modules must stay independent')
  }
  return `crp-status-ask:status=${status.moduleName};ask=${ask.moduleName}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/status-ask.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readStatusAndAskDispatch()}\n`)
}
