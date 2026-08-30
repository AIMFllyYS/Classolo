import { createStore } from 'zustand/vanilla'

export type CaptureStatus = 'idle' | 'recording' | 'paused' | 'stopped'

export interface TranscriptPrivateState {
  status: CaptureStatus
  level: number
  error: string | null
  partial: string
  highlightId: string | null
}

const initialState: TranscriptPrivateState = {
  status: 'idle',
  level: 0,
  error: null,
  partial: '',
  highlightId: null,
}

export const transcriptPrivateStore = createStore<TranscriptPrivateState>(
  () => initialState,
)

export function getTranscriptPrivate(): TranscriptPrivateState {
  return transcriptPrivateStore.getState()
}

export function patchTranscriptPrivate(
  patch: Partial<TranscriptPrivateState>,
): void {
  transcriptPrivateStore.setState(patch)
}

export function resetTranscriptPrivate(): void {
  transcriptPrivateStore.setState(initialState)
}
