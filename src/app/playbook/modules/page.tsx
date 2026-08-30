import Link from 'next/link'
import { crpHostKit } from '@/features/render-modules/kit'
import { modulePresets, playbookNav } from '@/features/playbook/registry'

export default function PlaybookModulesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-8 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/playbook/" className="text-primary hover:underline">
          Playbook
        </Link>
        <span className="mx-2">/</span>
        渲染模块
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-foreground">CRP 模块演示</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        每个渲染模块的演示只放这里。实现仍在{' '}
        <code className="text-foreground">src/features/render-modules/</code>
        ，本页只挂样例 props。当前注册{' '}
        {Object.keys(crpHostKit.renderModuleRegistry).length} 个模块。
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
        {modulePresets.map((item) => (
          <li key={item.id} className="rounded-lg border border-border bg-card p-4">
            <p className="font-medium text-card-foreground">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
