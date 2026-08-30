'use client'

import { WorkbenchShell } from '@/components/layout'

export function WorkbenchShowcase() {
  return (
    <section className="mt-10 space-y-4" data-slot="workbench-shell">
      <div>
        <h2 className="text-lg font-semibold text-foreground">工作台壳层</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          四区分屏与窄屏降级来自 <code>src/components/layout</code>
          ，业务页只组装，不复制一套布局。
        </p>
      </div>
      <div className="h-96 overflow-hidden rounded-lg border border-border">
        <WorkbenchShell
          nav={<p className="p-2 text-xs text-muted-foreground">导航</p>}
          transcript={<p>文稿区样例</p>}
          notes={<p>笔记区样例</p>}
          transcriptRender={<p>文稿渲染</p>}
          notesRender={<p>笔记渲染</p>}
        />
      </div>
    </section>
  )
}
