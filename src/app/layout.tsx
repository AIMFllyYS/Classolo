import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Classolo',
  description:
    'AI 课堂工作台 —— 实时录音转文字、AI 思维导图笔记与生成式组件渲染的一站式上课赋能平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
