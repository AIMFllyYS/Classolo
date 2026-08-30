/**
 * Session 公开切片类型（ADR-0017）。
 * 不含密钥、xyflow 坐标、partial 文稿、布局比例。
 */

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped'

export interface TranscriptCommittedSegment {
  id: string
  seq: number
  text: string
  startMs: number
  endMs: number
}

export interface TranscriptPublic {
  sessionId: string | null
  recordingStatus: RecordingStatus
  committed: readonly TranscriptCommittedSegment[]
  committedVersion: number
  latestCommittedId: string | null
}

export interface OutlineDigestNode {
  id: string
  title: string
}

export interface NotesPublic {
  outlineVersion: number
  outlineDigest: readonly OutlineDigestNode[]
}

export interface SettingsPublic {
  asrConfigVersion: number
  aiConfigVersion: number
  hotwordsVersion: number
  asrReady: boolean
  aiReady: boolean
}
