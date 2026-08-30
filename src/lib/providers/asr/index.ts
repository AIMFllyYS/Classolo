/**
 * ASR Provider 工厂。适配器按协议族放在本目录：
 *   realtime-ws/    阶跃 stepaudio-2.5-asr-stream + 百炼 qwen3-asr-flash-realtime（双 dialect）
 *   transcriptions-rest/  OpenAI 兼容文件端点 + 切片伪流式降级
 *   local-engine/   sherpa-onnx（Electron 阶段接入）
 * 业务代码只 import 本文件与 types.ts。
 */
export type {
  ASRCapabilities,
  ASRConfig,
  ASRFamily,
  ASRProvider,
  ASRSegment,
} from './types'

import type { ASRConfig, ASRProvider } from './types'

export function createASRProvider(config: ASRConfig): ASRProvider {
  switch (config.family) {
    // P0 适配器在此接入（ADR-0004）
    default:
      throw new Error(`ASR family not implemented yet: ${config.family}`)
  }
}
