import { publishCommand } from '@/lib/session'

export function publishOutlineJump(segmentId: string): void {
  publishCommand({
    type: 'transcript.scrollTo',
    segmentId,
    source: 'notes',
  })
}
