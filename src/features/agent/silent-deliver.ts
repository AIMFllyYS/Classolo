import { getNotesPublic, getTranscriptPublic } from '@/lib/session'
import { upsertRenderMessage } from '@/lib/session/writes/render'

export const SILENT_RENDER_ID = 'silent-agent-supplement'

export function deliverSilentRender(): void {
  const titles = getNotesPublic().outlineDigest.map((node) => node.title)
  const recent = getTranscriptPublic()
    .committed.slice(-4)
    .map((segment) => segment.text)
  const markdown =
    titles.length > 0
      ? `## 课堂补充\n${titles.map((title) => `- ${title}`).join('\n')}`
      : `## 课堂补充\n${recent.join('\n') || '（等待更多文稿）'}`
  upsertRenderMessage({
    id: SILENT_RENDER_ID,
    module: 'rich-text',
    version: '1.0',
    target: 'notes',
    props: { markdown },
    meta: {
      createdAt: Date.now(),
      source: 'silent-agent',
    },
  })
}
