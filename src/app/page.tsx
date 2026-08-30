import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">
        Class<span className="text-primary">olo</span>
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        AI 课堂工作台 —— 实时录音转文字、AI 思维导图笔记与生成式组件渲染
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        <Link href="/settings/" className="text-primary hover:underline">
          设置
        </Link>
        <span className="mx-2">·</span>
        <Link href="/playbook/" className="text-primary hover:underline">
          Playbook
        </Link>
      </p>
    </main>
  )
}
