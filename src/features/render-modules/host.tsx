'use client'

import { getRenderMessages, useRenderProjection } from '@/lib/session'
import type { RenderMessage } from './types'

export function RenderHost({ target }: { target: RenderMessage['target'] }) {
  const revision = useRenderProjection(
    (state) =>
      `${target}:${state.order.filter((id) => state.byId[id]?.target === target).join(',')}`,
  )
  const messages = getRenderMessages(target)
  void revision

  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {target === 'transcript' ? '文稿' : '笔记'}渲染区空闲
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {messages.map((message) => (
        <li
          key={message.id}
          className="rounded-md border border-border bg-card p-2 text-sm text-card-foreground"
          data-slot="render-message"
          data-module={message.module}
        >
          {message.module} · {message.id}
        </li>
      ))}
    </ul>
  )
}
