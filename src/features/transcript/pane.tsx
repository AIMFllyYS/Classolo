'use client'

import { useStore } from 'zustand'

import { Button } from '@/components/ui/button'
import { useTranscriptPublic } from '@/lib/session'

import {
  pauseCapture,
  resumeCapture,
  startCapture,
  stopCapture,
} from './capture'
import { transcriptPrivateStore } from './private-store'

export function TranscriptPane() {
  const status = useTranscriptPublic((state) => state.recordingStatus)
  const count = useTranscriptPublic((state) => state.committed.length)
  const error = useStore(transcriptPrivateStore, (state) => state.error)
  const level = useStore(transcriptPrivateStore, (state) => state.level)

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => void startCapture()}
          disabled={status === 'recording' || status === 'paused'}
        >
          开始
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() =>
            void (status === 'paused' ? resumeCapture() : pauseCapture())
          }
          disabled={status !== 'recording' && status !== 'paused'}
        >
          {status === 'paused' ? '继续' : '暂停'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void stopCapture()}
          disabled={status !== 'recording' && status !== 'paused'}
        >
          结束
        </Button>
      </div>
      <p className="text-muted-foreground">
        录音状态：<span className="text-foreground">{status}</span>
        <span className="mx-2">·</span>
        电平 {Math.round(level * 100)}%
      </p>
      <p className="text-muted-foreground">已确认段：{count}</p>
      {error ? (
        <p className="text-destructive" data-slot="capture-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
