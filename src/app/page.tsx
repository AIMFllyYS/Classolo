import { WorkbenchShell } from '@/components/layout'

export default function HomePage() {
  return (
    <WorkbenchShell
      transcript={<p className="text-sm text-muted-foreground">录音转写将显示在这里。</p>}
      notes={<p className="text-sm text-muted-foreground">大纲与思维导图将显示在这里。</p>}
      transcriptRender={
        <p className="text-sm text-muted-foreground">文稿侧渲染模块挂载点。</p>
      }
      notesRender={
        <p className="text-sm text-muted-foreground">笔记侧渲染模块挂载点。</p>
      }
    />
  )
}
