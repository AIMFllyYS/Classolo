import Link from 'next/link'
import {
  modulePresets,
  motionPresets,
  playbookNav,
  uiPresets,
} from '@/features/playbook/registry'

function PresetList({
  title,
  items,
}: {
  title: string
  items: { id: string; title: string; status: string; summary: string }[]
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-medium text-foreground">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-card-foreground">{item.title}</span>
              <span className="text-xs text-muted-foreground">{item.status}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function PlaybookPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-8 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="text-primary hover:underline">
          工作台
        </Link>
        <span className="mx-2">/</span>
        Playbook
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
        Playbook
      </h1>
      <p className="mt-3 text-muted-foreground">
        动效、预设 UI 与 CRP 渲染模块的唯一目录。业务里复用这些 id，不要在
        feature 里另起一套。
      </p>
      <nav className="mt-6 flex flex-wrap gap-3 text-sm">
        {playbookNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md border border-border px-3 py-1.5 text-foreground hover:bg-muted"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <PresetList title="UI 预设" items={uiPresets} />
      <PresetList title="动效" items={motionPresets} />
      <PresetList title="渲染模块" items={modulePresets} />
    </main>
  )
}
