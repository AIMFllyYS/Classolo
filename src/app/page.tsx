import { WorkbenchShell } from '@/components/layout'
import { NotesPane } from '@/features/notes/pane'
import { RenderHost } from '@/features/render-modules/host'
import { TranscriptPane } from '@/features/transcript/pane'

export default function HomePage() {
  return (
    <WorkbenchShell
      transcript={<TranscriptPane />}
      notes={<NotesPane />}
      transcriptRender={<RenderHost target="transcript" />}
      notesRender={<RenderHost target="notes" />}
    />
  )
}
