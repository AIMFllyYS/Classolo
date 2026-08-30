import { z } from 'zod'

import { resolveRenderView } from './dispatch'
import { imageModule } from './image/manifest'
import { listRenderTools, type RenderModuleRegistry } from './manifest'
import type { RenderModuleManifest } from './manifest'
import type { RenderMessage } from './types'

const stub: RenderModuleManifest<{ title: string }> = {
  name: 'stub',
  version: '1.0',
  toolName: 'render_stub',
  description: 'probe-only stub',
  propsSchema: z.object({ title: z.string() }),
  Component: () => null,
}

const registry = { stub } as RenderModuleRegistry

function sample(
  props: unknown,
  moduleName = 'stub',
): RenderMessage {
  return {
    id: 'card-1',
    module: moduleName,
    version: '1.0',
    target: 'notes',
    props,
    meta: { createdAt: 1, source: 'system' },
  }
}

export function readInvalidPropsShowError(): string {
  const invalid = resolveRenderView(sample({ title: 1 }), registry)
  if (invalid.ok || !invalid.error.includes('非法 props')) {
    throw new Error('invalid props must yield an error card, not a crash')
  }
  const unknown = resolveRenderView(sample({ title: 'x' }, 'missing'), registry)
  if (unknown.ok || !unknown.error.includes('未知渲染模块')) {
    throw new Error('unknown module must yield an error card')
  }
  const valid = resolveRenderView(sample({ title: 'ok' }), registry)
  if (!valid.ok || valid.props === null) {
    throw new Error('valid props must dispatch')
  }
  const tools = listRenderTools(registry)
  if (tools.length !== 1 || tools[0]?.name !== 'render_stub') {
    throw new Error('manifest must derive agent tool names')
  }
  if (imageModule.toolName !== 'render_image') {
    throw new Error('image module must stay registered')
  }
  return `crp-dispatch:invalid;tools=${tools.length}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/dispatch.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readInvalidPropsShowError()}\n`)
}
