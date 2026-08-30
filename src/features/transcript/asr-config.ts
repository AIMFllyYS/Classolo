import type { ASRConfig, ASRFamily } from '@/lib/providers/asr'

function readEnv(name: string): string {
  if (typeof process === 'undefined' || !process.env) return ''
  const publicValue = process.env[`NEXT_PUBLIC_${name}`]
  const value = process.env[name]
  const picked = publicValue ?? value ?? ''
  return typeof picked === 'string' ? picked.trim() : ''
}

/** Non-secret ASR fields. The key is resolved inside createASRProvider. */
export function readAsrRuntimeConfig(): ASRConfig {
  const family = (readEnv('ASR_FAMILY') || 'realtime-ws') as ASRFamily
  const dialect = readEnv('ASR_DIALECT') || 'stepfun'
  const sampleRate = Number(readEnv('ASR_SAMPLE_RATE') || '16000')
  return {
    family,
    dialect,
    baseUrl: readEnv('ASR_BASE_URL'),
    apiKey: '',
    model: readEnv('ASR_MODEL') || 'stepaudio-2.5-asr-stream',
    sampleRate: Number.isFinite(sampleRate) ? sampleRate : 16000,
  }
}
