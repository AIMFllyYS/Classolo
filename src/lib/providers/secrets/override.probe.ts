import { getSettingsPublic } from '@/lib/session'

import {
  USER_SECRET_BACKEND,
  USER_SECRET_WRITES_TO_PGLITE,
  clearAllUserSecretOverrides,
  getProviderCredentialRefs,
  setUserSecretOverride,
} from './override-store'
import { resolveSecret } from './resolve'

export function readUserOverrideBeatsEnvAndSkipsPglite(): string {
  clearAllUserSecretOverrides()
  const saved = process.env.AI_API_KEY
  const savedPublic = process.env.NEXT_PUBLIC_AI_API_KEY
  process.env.AI_API_KEY = 'env-key-must-lose'
  delete process.env.NEXT_PUBLIC_AI_API_KEY
  try {
    const fromEnv = resolveSecret('ai')
    if (fromEnv.source !== 'env' || fromEnv.value !== 'env-key-must-lose') {
      throw new Error('empty override must fall back to env')
    }
    setUserSecretOverride('ai', 'user-key-must-win')
    const fromUser = resolveSecret('ai')
    if (fromUser.source !== 'user' || fromUser.value !== 'user-key-must-win') {
      throw new Error('stored user override must beat env without an argument')
    }
    const refs = getProviderCredentialRefs()
    const aiRef = refs.find((item) => item.kind === 'ai')
    if (!aiRef?.hasCredential || !aiRef.credentialRef.startsWith('classolo.cred.')) {
      throw new Error('profile ref must record configured handle, not the secret')
    }
    const refSnap = JSON.stringify(refs)
    const pubSnap = JSON.stringify(getSettingsPublic())
    if (
      refSnap.includes('user-key-must-win') ||
      pubSnap.includes('user-key-must-win') ||
      pubSnap.includes('apiKey')
    ) {
      throw new Error('credential refs / public slices leaked the key')
    }
    if (USER_SECRET_WRITES_TO_PGLITE || USER_SECRET_BACKEND !== 'sessionStorage') {
      throw new Error('P0 secrets must stay on sessionStorage, not PGlite')
    }
    setUserSecretOverride('ai', '')
    const afterClear = resolveSecret('ai')
    if (afterClear.source !== 'env' || afterClear.value !== 'env-key-must-lose') {
      throw new Error('clearing override must restore env')
    }
    return `secret-override:source=${fromUser.source};pglite=${USER_SECRET_WRITES_TO_PGLITE}`
  } finally {
    clearAllUserSecretOverrides()
    if (saved === undefined) delete process.env.AI_API_KEY
    else process.env.AI_API_KEY = saved
    if (savedPublic === undefined) delete process.env.NEXT_PUBLIC_AI_API_KEY
    else process.env.NEXT_PUBLIC_AI_API_KEY = savedPublic
  }
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/override.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readUserOverrideBeatsEnvAndSkipsPglite()}\n`)
}
