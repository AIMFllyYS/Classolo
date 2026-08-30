'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  usePanelRef,
} from 'react-resizable-panels'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { isWorkbenchNarrow, WORKBENCH_MIN_WIDTH_PX } from './narrow'

export interface WorkbenchShellProps {
  nav?: ReactNode
  transcript?: ReactNode
  notes?: ReactNode
  transcriptRender?: ReactNode
  notesRender?: ReactNode
}

function Pane({
  title,
  children,
  className,
}: {
  title: string
  children?: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'flex h-full min-h-0 flex-col bg-background text-foreground',
        className,
      )}
    >
      <header className="border-b border-border px-3 py-2 text-sm font-medium text-muted-foreground">
        {title}
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-3">{children}</div>
    </section>
  )
}

export function WorkbenchShell({
  nav,
  transcript,
  notes,
  transcriptRender,
  notesRender,
}: WorkbenchShellProps) {
  const navPanelRef = usePanelRef()
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === 'undefined' ? WORKBENCH_MIN_WIDTH_PX : window.innerWidth,
  )
  const rootLayout = useDefaultLayout({ id: 'workbench-root' })
  const columnsLayout = useDefaultLayout({ id: 'workbench-columns' })
  const transcriptStackLayout = useDefaultLayout({
    id: 'workbench-transcript-stack',
  })
  const notesStackLayout = useDefaultLayout({ id: 'workbench-notes-stack' })

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (isWorkbenchNarrow(viewportWidth)) {
    return (
      <div
        className="flex h-screen min-h-0 w-full items-center justify-center bg-background p-6 text-center"
        data-slot="workbench-shell-narrow"
      >
        <p className="max-w-sm text-sm text-muted-foreground">
          当前窗口过窄（小于 {WORKBENCH_MIN_WIDTH_PX}px）。课堂四区分屏已暂停，请加宽窗口或改用更大的屏幕，以免布局错位。
        </p>
      </div>
    )
  }

  return (
    <div
      className="flex h-screen min-h-0 w-full bg-background"
      data-slot="workbench-shell"
    >
      <Group
        id="workbench-root"
        orientation="horizontal"
        className="h-full w-full"
        defaultLayout={rootLayout.defaultLayout}
        onLayoutChanged={rootLayout.onLayoutChanged}
      >
        <Panel
          id="workbench-nav"
          panelRef={navPanelRef}
          collapsible
          collapsedSize={48}
          minSize={160}
          defaultSize={220}
          onResize={() => {
            setNavCollapsed(navPanelRef.current?.isCollapsed() ?? false)
          }}
        >
          <aside className="flex h-full flex-col border-r border-border bg-sidebar text-sidebar-foreground">
            <div className="flex items-center justify-between gap-2 border-b border-sidebar-border px-2 py-2">
              {navCollapsed ? null : (
                <span className="text-sm font-semibold">Classolo</span>
              )}
              <Button
                type="button"
                size="xs"
                variant="ghost"
                className="ml-auto"
                onClick={() => {
                  if (navPanelRef.current?.isCollapsed()) {
                    navPanelRef.current.expand()
                  } else {
                    navPanelRef.current?.collapse()
                  }
                }}
              >
                {navCollapsed ? '展开' : '收起'}
              </Button>
            </div>
            <nav className="flex flex-col gap-1 p-3 text-sm">
              {nav ?? (
                <>
                  <Link href="/" className="text-sidebar-primary hover:underline">
                    工作台
                  </Link>
                  <Link
                    href="/settings/"
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    设置
                  </Link>
                  <Link
                    href="/playbook/"
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Playbook
                  </Link>
                </>
              )}
            </nav>
          </aside>
        </Panel>
        <Separator className="w-1 bg-border" />
        <Panel id="workbench-main" minSize={400}>
          <Group
            id="workbench-columns"
            orientation="horizontal"
            className="h-full w-full"
            defaultLayout={columnsLayout.defaultLayout}
            onLayoutChanged={columnsLayout.onLayoutChanged}
          >
            <Panel id="workbench-transcript-col" defaultSize="50" minSize={180}>
              <Group
                id="workbench-transcript-stack"
                orientation="vertical"
                className="h-full w-full"
                defaultLayout={transcriptStackLayout.defaultLayout}
                onLayoutChanged={transcriptStackLayout.onLayoutChanged}
              >
                <Panel id="workbench-transcript" defaultSize="65" minSize={120}>
                  <Pane title="文稿区">{transcript}</Pane>
                </Panel>
                <Separator className="h-1 bg-border" />
                <Panel id="workbench-transcript-render" minSize={80}>
                  <Pane title="文稿渲染区">{transcriptRender}</Pane>
                </Panel>
              </Group>
            </Panel>
            <Separator className="w-1 bg-border" />
            <Panel id="workbench-notes-col" minSize={180}>
              <Group
                id="workbench-notes-stack"
                orientation="vertical"
                className="h-full w-full"
                defaultLayout={notesStackLayout.defaultLayout}
                onLayoutChanged={notesStackLayout.onLayoutChanged}
              >
                <Panel id="workbench-notes" defaultSize="65" minSize={120}>
                  <Pane title="笔记区">{notes}</Pane>
                </Panel>
                <Separator className="h-1 bg-border" />
                <Panel id="workbench-notes-render" minSize={80}>
                  <Pane title="笔记渲染区">{notesRender}</Pane>
                </Panel>
              </Group>
            </Panel>
          </Group>
        </Panel>
      </Group>
    </div>
  )
}
