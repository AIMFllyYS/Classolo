import type { ResolvedSecret, SecretKind } from './types'

const ENV_KEYS: Record<SecretKind, readonly string[]> = {
  ai: ['AI_API_KEY', 'NEXT_PUBLIC_AI_API_KEY'],
  asr: ['ASR_API_KEY', 'NEXT_PUBLIC_ASR_API_KEY'],
  'image-search': ['IMAGE_SEARCH_API_KEY', 'NEXT_PUBLIC_IMAGE_SEARCH_API_KEY'],
}

function readEnv(kind: SecretKind): string | null {
  if (typeof process === 'undefined' || !process.env) return null
  for (const key of ENV_KEYS[kind]) {
    const value = process.env[key]
    if (typeof value === 'string' && value.trim() !== '') return value.trim()
  }
  return null
}

/**
 * 用户覆盖由设置页注入（Electron safeStorage / 内存 Map）。
 * P0 未接设置页前传 `undefined`，即退化为纯 env。
 */
export function resolveSecret(
  kind: SecretKind,
  userOverride?: string | null,
): ResolvedSecret {
  const user = userOverride?.trim() ?? ''
  if (user !== '') {
    return { kind, value: user, source: 'user' }
  }
  const env = readEnv(kind)
  if (env) {
    return { kind, value: env, source: 'env' }
  }
  return { kind, value: null, source: 'none' }
}
