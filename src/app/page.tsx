import { WorkbenchShell } from '@/components/layout'
import { ChatPanel } from '@/features/agent/chat-panel'
import { SilentAgentBoot } from '@/features/agent/silent-boot'
import { NotesPane } from '@/features/notes/pane'
import { RenderHost } from '@/features/render-modules/host'
import { TranscriptPane } from '@/features/transcript/pane'

export default function HomePage() {
  return (
    <div className="relative h-screen">
      <SilentAgentBoot />
      <ChatPanel />
      <WorkbenchShell
        transcript={<TranscriptPane />}
        notes={<NotesPane />}
        transcriptRender={<RenderHost target="transcript" />}
        notesRender={<RenderHost target="notes" />}
      />
    </div>
  )
}
