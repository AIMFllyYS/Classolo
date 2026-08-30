'use client'

import { Streamdown } from 'streamdown'

import { cn } from '@/lib/utils'

export function MarkdownStream({
  markdown,
  className,
}: {
  markdown: string
  className?: string
}) {
  return (
    <div className={cn('max-w-none text-sm text-foreground', className)}>
      <Streamdown>{markdown}</Streamdown>
    </div>
  )
}
