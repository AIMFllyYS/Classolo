import { getNotesPublic, getTranscriptPublic } from '@/lib/session'

import {
  isWorkbenchNarrow,
  WORKBENCH_LAYOUT_STORAGE_PREFIX,
  WORKBENCH_MIN_WIDTH_PX,
} from './narrow'

export function readNarrowLayoutDoesNotTouchSession(): string {
  if (!isWorkbenchNarrow(WORKBENCH_MIN_WIDTH_PX - 1)) {
    throw new Error('width below minimum must be narrow')
  }
  if (isWorkbenchNarrow(WORKBENCH_MIN_WIDTH_PX)) {
    throw new Error('minimum width must still use the split layout')
  }
  const pub = `${JSON.stringify(getNotesPublic())}${JSON.stringify(getTranscriptPublic())}`
  if (
    pub.includes('defaultSize') ||
    pub.includes(WORKBENCH_LAYOUT_STORAGE_PREFIX) ||
    pub.includes('cs_')
  ) {
    throw new Error('layout ratios must not appear on session slices or cs_ tables')
  }
  return `layout-narrow:min=${WORKBENCH_MIN_WIDTH_PX}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/narrow.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readNarrowLayoutDoesNotTouchSession()}\n`)
}
