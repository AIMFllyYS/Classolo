/**
 * Feature 跨域通信唯一入口（ADR-0017）。
 * 只导出公开只读切片。writes/* 不从本文件再导出。
 * 禁止存放 API key 或分屏比例。
 */
export { sessionPublicKit, type SessionPublicKit } from './public-kit'
export {
  getNotesPublic,
  subscribeNotesPublic,
  useNotesPublic,
} from './reads/notes'
export {
  getSettingsPublic,
  subscribeSettingsPublic,
  useSettingsPublic,
} from './reads/settings'
export {
  getTranscriptPublic,
  subscribeTranscriptPublic,
  useTranscriptPublic,
} from './reads/transcript'
export type {
  NotesPublic,
  OutlineDigestNode,
  RecordingStatus,
  SettingsPublic,
  TranscriptCommittedSegment,
  TranscriptPublic,
} from './types'
