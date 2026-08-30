import { notFound } from 'next/navigation'
import Link from 'next/link'

import { CrpDemo } from '@/app/playbook/_crp-demo'

export default function DevDebugPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-8 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="text-primary hover:underline">
          工作台
        </Link>
        <span className="mx-2">/</span>
        _dev
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-foreground">调试</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        一次性实验页。production 走 notFound()。正式代码不得引用本目录。
      </p>
      <CrpDemo />
    </main>
  )
}
