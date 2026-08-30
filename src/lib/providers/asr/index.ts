/**
 * ASR Provider 工厂。适配器按协议族放在本目录：
 *   realtime-ws/    阶跃 stepaudio-2.5-asr-stream + 百炼 qwen3-asr-flash-realtime（双 dialect）
 *   transcriptions-rest/  OpenAI 兼容文件端点 + 切片伪流式降级
 *   local-engine/   sherpa-onnx（Electron 阶段接入）
 * 业务代码只 import 本文件与 types.ts。
 */
import { getCustomHotwords, mergeHotwords } from './custom-hotwords'
import { getSelectedHotwordPackId, resolveHotwordPack } from './hotword-packs'
import type { ASRConfig, ASRProvider } from './types'
import { StepfunRealtimeWsProvider } from './realtime-ws/stepfun'
import { OpenAiCompatibleTranscriptionsProvider } from './transcriptions-rest/openai-compatible'

export type {
  ASRCapabilities,
  ASRConfig,
  ASRFamily,
  ASRProvider,
  ASRSegment,
} from './types'
export { MissingAsrSecretError, MISSING_ASR_SECRET_MESSAGE } from './missing-secret'
export {
  DEFAULT_HOTWORD_PACK_ID,
  getSelectedHotwordPackId,
  listHotwordPacks,
  resetHotwordPackSelection,
  resolveHotwordPack,
  selectHotwordPack,
  subscribeHotwordPack,
  type HotwordPack,
} from './hotword-packs'
export { hotwordsForStart } from './hotwords'
export {
  getCustomHotwordText,
  getCustomHotwords,
  mergeHotwords,
  parseCustomHotwordText,
  resetCustomHotwords,
  setCustomHotwords,
  subscribeCustomHotwords,
} from './custom-hotwords'

export function withHotwordPack(config: ASRConfig): ASRConfig {
  const packTerms =
    config.hotwords && config.hotwords.length > 0
      ? config.hotwords
      : [...resolveHotwordPack(getSelectedHotwordPackId())]
  return {
    ...config,
    hotwords: mergeHotwords(packTerms, getCustomHotwords()),
  }
}

export function createASRProvider(config: ASRConfig): ASRProvider {
  if (!config.family) {
    throw new Error('缺 ASR 协议族：必须显式配置，禁止从 URL 推断')
  }
  if (!config.dialect) {
    throw new Error('缺 ASR dialect：必须显式配置，禁止从 URL 推断')
  }
  switch (config.family) {
    case 'realtime-ws':
      if (config.dialect === 'stepfun') {
        return new StepfunRealtimeWsProvider(withHotwordPack(config))
      }
      throw new Error(`ASR dialect not implemented yet: ${config.dialect}`)
    case 'transcriptions-rest':
      if (config.dialect === 'openai-compatible') {
        return new OpenAiCompatibleTranscriptionsProvider(withHotwordPack(config))
      }
      throw new Error(`ASR dialect not implemented yet: ${config.dialect}`)
    default:
      throw new Error(`ASR family not implemented yet: ${config.family}`)
  }
}
