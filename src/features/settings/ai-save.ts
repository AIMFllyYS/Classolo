import { setUserSecretOverride } from '@/lib/providers/secrets'
import { getSettingsPublic, publishCommand } from '@/lib/session'
import { patchSettingsPublic } from '@/lib/session/writes/settings'

import {
  pingAiProvider,
  type AiConnectionDraft,
  type AiPingResult,
} from './ai-ping'
import { patchAiPrivate } from './private-store'

export type AiPing = (draft: AiConnectionDraft) => Promise<AiPingResult>

export async function saveAiSettings(
  draft: AiConnectionDraft,
  ping: AiPing = pingAiProvider,
): Promise<AiPingResult> {
  const next: AiConnectionDraft = {
    baseUrl: draft.baseUrl.trim(),
    model: draft.model.trim(),
    apiKey: draft.apiKey.trim(),
  }
  patchAiPrivate(next)
  setUserSecretOverride('ai', next.apiKey || null)
  const result = await ping(next)
  const current = getSettingsPublic()
  patchSettingsPublic({
    aiConfigVersion: current.aiConfigVersion + 1,
    aiReady: result.ok,
  })
  publishCommand({ type: 'ai.configChanged', source: 'settings' })
  return result
}
