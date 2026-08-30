'use client'

import { useTranscriptPublic } from '@/lib/session'

export function TranscriptPane() {
  const status = useTranscriptPublic((state) => state.recordingStatus)
  const count = useTranscriptPublic((state) => state.committed.length)

  return (
    <div className="space-y-2 text-sm">
      <p className="text-muted-foreground">
        录音状态：<span className="text-foreground">{status}</span>
      </p>
      <p className="text-muted-foreground">已确认段：{count}</p>
    </div>
  )
}
