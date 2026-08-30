'use client'

import { CrpSampleSeeder } from '@/features/agent/crp-sample-seeder'
import { RenderHost } from '@/features/render-modules/host'

export function CrpDemo() {
  return (
    <div className="mt-8 space-y-6" data-slot="crp-sample-board">
      <CrpSampleSeeder />
      <section>
        <h2 className="text-lg font-medium text-foreground">笔记渲染区</h2>
        <div className="mt-2">
          <RenderHost target="notes" />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-medium text-foreground">
          文稿渲染区（含校验失败卡片）
        </h2>
        <div className="mt-2">
          <RenderHost target="transcript" />
        </div>
      </section>
    </div>
  )
}
