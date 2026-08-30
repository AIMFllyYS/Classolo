import Link from 'next/link'
import { MotionShowcase } from '@/features/playbook/motion-showcase'
import { motionPresets, playbookNav } from '@/features/playbook/registry'

export default function PlaybookMotionPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-8 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/playbook/" className="text-primary hover:underline">
          Playbook
        </Link>
        <span className="mx-2">/</span>
        动效
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-foreground">动效预设</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        新的共享动画先在{' '}
        <code className="text-foreground">src/features/playbook/registry.ts</code>{' '}
        登记，再在本页挂演示。禁止在业务 feature 里写一次性魔法数字动画。
      </p>
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
        {motionPresets.map((item) => (
          <li key={item.id} className="rounded-lg border border-border bg-card p-4">
            <p className="font-medium text-card-foreground">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.status}</p>
          </li>
        ))}
      </ul>
      <MotionShowcase />
    </main>
  )
}
