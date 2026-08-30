/**
 * 本目录是密钥解析的唯一入口（ADR-0013）。
 * 实现随设置页 / Electron 落地；调用方只依赖 resolveSecret 的语义，不依赖存储介质。
 */
export type { ResolvedSecret, SecretKind, SecretSource } from './types'
export { resolveSecret } from './resolve'
