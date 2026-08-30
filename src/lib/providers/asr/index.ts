/**
 * ASR Provider 工厂。适配器按协议族放在本目录：
 *   realtime-ws/    阶跃 stepaudio-2.5-asr-stream + 百炼 qwen3-asr-flash-realtime（双 dialect）
 *   transcriptions-rest/  OpenAI 兼容文件端点 + 切片伪流式降级
 *   local-engine/   sherpa-onnx（Electron 阶段接入）
 * 业务代码只 import 本文件与 types.ts。
 */
import { getSelectedHotwordPackId, resolveHotwordPack } from './hotword-packs'
import type { ASRConfig, ASRProvider } from './types'
import { StepfunRealtimeWsProvider } from './realtime-ws/stepfun'

export type {
  ASRCapabilities,
  ASRConfig,
  ASRFamily,
  ASRProvider,
  ASRSegment,
} from './types'
export { MissingAsrSecretError, MISSING_ASR_SECRET_MESSAGE } from './missing-secret'
export {
  getSelectedHotwordPackId,
  listHotwordPacks,
  resetHotwordPackSelection,
  resolveHotwordPack,
  selectHotwordPack,
  type HotwordPack,
} from './hotword-packs'
export { hotwordsForStart } from './hotwords'

export function withHotwordPack(config: ASRConfig): ASRConfig {
  if (config.hotwords && config.hotwords.length > 0) {
    return config
  }
  return {
    ...config,
    hotwords: [...resolveHotwordPack(getSelectedHotwordPackId())],
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
    default:
      throw new Error(`ASR family not implemented yet: ${config.family}`)
  }
}
