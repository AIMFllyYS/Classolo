import type { SecretKind } from './types'

export const USER_SECRET_STORAGE_KEY = 'classolo:user-secret-overrides'

/** P0 browser backend. Electron `safeStorage` is reserved for packaging. */
export const USER_SECRET_BACKEND = 'sessionStorage' as const

/** Credential rows never go through PGlite (ADR-0013). */
export const USER_SECRET_WRITES_TO_PGLITE = false as const

export interface SecretOverrideBackend {
  readonly name: 'sessionStorage' | 'safeStorage'
  read: () => string | null
  write: (serialized: string) => void
}

export interface ProviderCredentialRef {
  kind: SecretKind
  /** Handle name in the credential store — never the secret itself. */
  credentialRef: string
  hasCredential: boolean
}

const KINDS: readonly SecretKind[] = ['ai', 'asr', 'image-search']

const memory = new Map<SecretKind, string>()
const refs = new Map<SecretKind, ProviderCredentialRef>()

const sessionStorageBackend: SecretOverrideBackend = {
  name: 'sessionStorage',
  read: () => {
    if (typeof sessionStorage === 'undefined') return null
    try {
      return sessionStorage.getItem(USER_SECRET_STORAGE_KEY)
    } catch {
      return null
    }
  },
  write: (serialized: string) => {
    if (typeof sessionStorage === 'undefined') return
    try {
      sessionStorage.setItem(USER_SECRET_STORAGE_KEY, serialized)
    } catch {
      // private-mode / quota: keep memory only
    }
  },
}

let backend: SecretOverrideBackend = sessionStorageBackend
let hydrated = false

function credentialRefFor(kind: SecretKind): string {
  return `classolo.cred.${kind}`
}

function syncRef(kind: SecretKind): void {
  refs.set(kind, {
    kind,
    credentialRef: credentialRefFor(kind),
    hasCredential: memory.has(kind),
  })
}

function persist(): void {
  const payload: Partial<Record<SecretKind, string>> = {}
  for (const [kind, value] of memory) {
    payload[kind] = value
  }
  backend.write(JSON.stringify(payload))
}

function hydrate(): void {
  if (hydrated) return
  hydrated = true
  const raw = backend.read()
  if (!raw) {
    for (const kind of KINDS) syncRef(kind)
    return
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      for (const kind of KINDS) syncRef(kind)
      return
    }
    const record = parsed as Record<string, unknown>
    for (const kind of KINDS) {
      const value = record[kind]
      if (typeof value === 'string' && value.trim() !== '') {
        memory.set(kind, value.trim())
      }
      syncRef(kind)
    }
  } catch {
    for (const kind of KINDS) syncRef(kind)
  }
}

export function setSecretOverrideBackendForTests(
  next: SecretOverrideBackend,
): void {
  backend = next
  hydrated = false
  memory.clear()
  refs.clear()
  hydrate()
}

export function resetSecretOverrideBackend(): void {
  backend = sessionStorageBackend
  hydrated = false
  memory.clear()
  refs.clear()
}

/**
 * Reserved for Electron packaging. P0 must not call this.
 * Desktop will swap `backend` to OS `safeStorage` without changing resolveSecret.
 */
export function createElectronSafeStorageBackend(): SecretOverrideBackend {
  throw new Error(
    'Electron safeStorage is reserved for desktop packaging; P0 uses sessionStorage',
  )
}

export function setUserSecretOverride(
  kind: SecretKind,
  value: string | null,
): void {
  hydrate()
  const trimmed = value?.trim() ?? ''
  if (trimmed === '') {
    memory.delete(kind)
  } else {
    memory.set(kind, trimmed)
  }
  syncRef(kind)
  persist()
}

export function getUserSecretOverride(kind: SecretKind): string | null {
  hydrate()
  return memory.get(kind) ?? null
}

export function clearAllUserSecretOverrides(): void {
  hydrate()
  memory.clear()
  for (const kind of KINDS) syncRef(kind)
  persist()
}

export function getProviderCredentialRef(
  kind: SecretKind,
): ProviderCredentialRef {
  hydrate()
  const existing = refs.get(kind)
  if (existing) return existing
  const created: ProviderCredentialRef = {
    kind,
    credentialRef: credentialRefFor(kind),
    hasCredential: false,
  }
  refs.set(kind, created)
  return created
}

export function getProviderCredentialRefs(): readonly ProviderCredentialRef[] {
  hydrate()
  return KINDS.map((kind) => getProviderCredentialRef(kind))
}
