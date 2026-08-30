import Link from 'next/link'
import { playbookNav, uiPresets } from '@/features/playbook/registry'
import { MindmapShowcase } from '@/features/playbook/mindmap-showcase'
import { UiKitShowcase } from '@/features/playbook/ui-kit-showcase'
import { WorkbenchShowcase } from '@/features/playbook/workbench-showcase'

export default function PlaybookUiPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-8 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/playbook/" className="text-primary hover:underline">
          Playbook
        </Link>
        <span className="mx-2">/</span>
        UI
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-foreground">UI 预设</h1>
      <nav className="mt-6 flex flex-wrap gap-3 text-sm">
        {playbookNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <ul className="mt-8 space-y-3">
        {uiPresets.map((item) => (
          <li key={item.id} className="rounded-lg border border-border bg-card p-4">
            <p className="font-medium text-card-foreground">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.status}</p>
          </li>
        ))}
      </ul>
      <UiKitShowcase />
      <WorkbenchShowcase />
      <MindmapShowcase />
    </main>
  )
}
