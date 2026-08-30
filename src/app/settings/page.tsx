import Link from 'next/link'

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-8">
      <h1 className="text-3xl font-semibold text-foreground">设置</h1>
      <p className="mt-3 text-muted-foreground">
        API / ASR 协议族、热词与主题（默认跟随系统）将在本页配置。用户在此填写的密钥优先级高于
        .env（ADR-0013）。
      </p>
      <p className="mt-6 text-sm">
        <Link href="/" className="text-primary hover:underline">
          返回工作台
        </Link>
        <span className="mx-3 text-muted-foreground">·</span>
        <Link href="/playbook/" className="text-primary hover:underline">
          Playbook
        </Link>
      </p>
    </main>
  )
}
