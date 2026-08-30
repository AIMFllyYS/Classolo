'use client'

import { classroomMindmapKit } from '@/components/mindmap'

const sampleOutline = [
  { id: 'root', title: '牛顿运动定律' },
  { id: 'n1', title: '第一定律', parentId: 'root' },
  { id: 'n2', title: '第二定律', parentId: 'root' },
  { id: 'n3', title: '第三定律', parentId: 'root' },
] as const

export function MindmapShowcase() {
  const { ClassroomMindmap } = classroomMindmapKit
  return (
    <section className="mt-10 space-y-4" data-slot="classroom-mindmap">
      <div>
        <h2 className="text-lg font-semibold text-foreground">课堂思维导图</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          树状布局与节点外观由 <code>src/components/mindmap</code> 提供，颜色走
          StudySolo 语义令牌。
        </p>
      </div>
      <div className="h-80 overflow-hidden rounded-lg border border-border bg-background">
        <ClassroomMindmap nodes={sampleOutline} />
      </div>
    </section>
  )
}
