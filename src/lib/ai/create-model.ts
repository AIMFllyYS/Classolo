import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

import { resolveSecret } from '../providers/secrets'

export const MISSING_AI_SECRET_MESSAGE =
  '缺密钥：未配置 AI API key（用户覆盖与运行时 env 均为空）' as const

type MissingKeyHint =
  typeof MISSING_AI_SECRET_MESSAGE extends `${string}缺密钥${string}`
    ? true
    : never
const missingKeyHintOk: MissingKeyHint = true
void missingKeyHintOk

export class MissingAISecretError extends Error {
  readonly code = 'MISSING_AI_SECRET' as const

  constructor() {
    super(MISSING_AI_SECRET_MESSAGE)
    this.name = 'MissingAISecretError'
  }
}

export interface CreateModelConfig {
  baseUrl: string
  model: string
  /** Settings-page user override. Wins over env (ADR-0013). */
  userOverride?: string | null
}

/**
 * Unique model factory. Resolves the key via resolveSecret; never accepts a
 * raw apiKey and never uses a string model ID (that would hit AI Gateway).
 */
export function createModel(config: CreateModelConfig) {
  const secret = resolveSecret('ai', config.userOverride)
  if (secret.value === null) {
    throw new MissingAISecretError()
  }

  const provider = createOpenAICompatible({
    name: 'classolo-user-provider',
    apiKey: secret.value,
    baseURL: config.baseUrl,
  })
  return provider(config.model)
}
