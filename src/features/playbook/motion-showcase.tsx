'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { classroomMindmapKit } from '@/components/mindmap'

const base = [
  { id: 'root', title: '牛顿运动定律' },
  { id: 'n1', title: '第一定律', parentId: 'root' },
] as const

export function MotionShowcase() {
  const { ClassroomMindmap } = classroomMindmapKit
  const [extra, setExtra] = useState(false)
  const nodes = extra
    ? [...base, { id: 'n2', title: '第二定律', parentId: 'root' as const }]
    : [...base]

  return (
    <section className="mt-10 space-y-4" data-slot="mindmap-node-enter">
      <div>
        <h2 className="text-lg font-semibold text-foreground">导图节点进入</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          新节点进入；已有节点不因重挂闪烁（ADR-0005）。
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setExtra((value) => !value)}
      >
        {extra ? '收回新节点' : '加入新节点'}
      </Button>
      <div className="h-72 overflow-hidden rounded-lg border border-border bg-background">
        <ClassroomMindmap nodes={nodes} />
      </div>
    </section>
  )
}
