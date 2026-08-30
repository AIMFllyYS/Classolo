import Link from 'next/link'

import { SettingsScreen } from '@/features/settings/screen'

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-8 py-12">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="text-primary hover:underline">
          工作台
        </Link>
        <span className="mx-2">/</span>
        设置
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-foreground">设置</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        用户在此填写的密钥优先于运行时 env（ADR-0013），且不写入公开切片或
        PGlite。
      </p>
      <SettingsScreen />
    </main>
  )
}
