import { z } from 'zod'

import { resolveRenderView } from '../dispatch'
import type { RenderModuleRegistry } from '../manifest'

import { richTextPropsSchema } from './schema'

export function readRichTextStreamingProps(): string {
  const registry = {
    'rich-text': {
      name: 'rich-text',
      version: '1.0',
      toolName: 'render_rich_text',
      description: 'probe',
      propsSchema: richTextPropsSchema as z.ZodType<unknown>,
      Component: () => null,
    },
  } as RenderModuleRegistry
  const incomplete = richTextPropsSchema.safeParse({
    markdown: '**未闭合的加粗与 $E=mc^2',
  })
  if (!incomplete.success) {
    throw new Error('incomplete streaming markdown must still be valid props')
  }
  const appended = richTextPropsSchema.safeParse({
    markdown: `${incomplete.data.markdown}\n\n下一句补充`,
  })
  if (!appended.success) {
    throw new Error('appended markdown must still parse')
  }
  const invalid = resolveRenderView(
    {
      id: 'rt-bad',
      module: 'rich-text',
      version: '1.0',
      target: 'notes',
      props: { markdown: 1 },
      meta: { createdAt: 1, source: 'system' },
    },
    registry,
  )
  if (invalid.ok) {
    throw new Error('illegal rich-text props must show error card path')
  }
  const valid = resolveRenderView(
    {
      id: 'rt-ok',
      module: 'rich-text',
      version: '1.0',
      target: 'transcript',
      props: { markdown: appended.data.markdown },
      meta: { createdAt: 2, source: 'silent-agent' },
    },
    registry,
  )
  if (!valid.ok) {
    throw new Error('legal rich-text props must dispatch')
  }
  return `rich-text:stream-append;invalid-rejected`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/rich-text.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readRichTextStreamingProps()}\n`)
}
