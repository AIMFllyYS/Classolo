import { getUserSecretOverride } from './override-store'
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
 * Priority: explicit argument > stored user override (sessionStorage) > env > none.
 * Electron safeStorage is a reserved backend swap; callers still use this function.
 */
export function resolveSecret(
  kind: SecretKind,
  userOverride?: string | null,
): ResolvedSecret {
  const explicit = userOverride?.trim() ?? ''
  if (explicit !== '') {
    return { kind, value: explicit, source: 'user' }
  }
  const stored = getUserSecretOverride(kind)
  if (stored) {
    return { kind, value: stored, source: 'user' }
  }
  const env = readEnv(kind)
  if (env) {
    return { kind, value: env, source: 'env' }
  }
  return { kind, value: null, source: 'none' }
}
