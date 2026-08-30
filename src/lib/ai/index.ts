/**
 * 本目录是 Vercel AI SDK 的唯一入口（ADR-0006）。
 * 业务代码禁止直接 import 'ai' / '@ai-sdk/openai-compatible'，一律经由此处。
 * 修改第三方调用方式时优先改这里。
 *
 * 硬规则：模型必须经 createOpenAICompatible 实例创建，
 * 禁止使用字符串模型 ID（会被 AI SDK 路由到 AI Gateway）。
 */
export { generateText, streamText, tool } from 'ai'
export { createOpenAICompatible } from '@ai-sdk/openai-compatible'

import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

export interface AIProviderConfig {
  apiKey: string
  baseUrl: string
  model: string
}

/** 用户自配的 OpenAI 兼容模型实例（设置页 / .env.local 注入） */
export function createModel(config: AIProviderConfig) {
  const provider = createOpenAICompatible({
    name: 'classolo-user-provider',
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  })
  return provider(config.model)
}
