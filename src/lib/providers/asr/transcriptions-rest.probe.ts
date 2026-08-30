import { setUserSecretOverride, clearAllUserSecretOverrides } from '@/lib/providers/secrets'

import { createASRProvider, hotwordsForStart } from './index'
import {
  OpenAiCompatibleTranscriptionsProvider,
  REST_SLICE_MS,
  type TranscriptionsRequest,
} from './transcriptions-rest/openai-compatible'
import type { ASRSegment } from './types'

export async function readTranscriptionsRestPseudoStream(): Promise<string> {
  clearAllUserSecretOverrides()
  setUserSecretOverride('asr', 'rest-probe-key')
  const requests: TranscriptionsRequest[] = []
  const finals: ASRSegment[] = []
  const provider = new OpenAiCompatibleTranscriptionsProvider(
    {
      family: 'transcriptions-rest',
      dialect: 'openai-compatible',
      baseUrl: 'https://api.example.com/v1',
      apiKey: '',
      model: 'whisper-1',
      sampleRate: 1000,
      hotwords: ['应被忽略'],
    },
    async (request) => {
      requests.push(request)
      return '切片识别'
    },
  )
  if (provider.capabilities.streaming !== 'pseudo') {
    throw new Error('REST family must declare pseudo streaming')
  }
  if (hotwordsForStart(provider.capabilities, ['应被忽略']) !== undefined) {
    throw new Error('unsupported hotwords must be omitted')
  }
  provider.onFinal((segment) => {
    finals.push(segment)
  })
  await provider.start()
  const samples = Math.floor((1000 * REST_SLICE_MS) / 1000)
  const pcm = new Int16Array(samples)
  pcm.fill(1)
  provider.sendAudio(pcm.buffer)
  await new Promise((resolve) => setTimeout(resolve, 20))
  await provider.stop()
  if (requests.length < 1) {
    throw new Error('a filled slice must POST /audio/transcriptions')
  }
  if (!requests[0]?.url.endsWith('/audio/transcriptions')) {
    throw new Error('endpoint must be transcriptions without inferring family from URL')
  }
  if (requests[0]?.apiKey !== 'rest-probe-key') {
    throw new Error('REST adapter must resolveSecret the ASR key')
  }
  if (finals[0]?.text !== '切片识别' || finals[0]?.isFinal !== true) {
    throw new Error('slice response must emit onFinal')
  }

  const factory = createASRProvider({
    family: 'transcriptions-rest',
    dialect: 'openai-compatible',
    baseUrl: 'https://api.example.com/v1',
    apiKey: '',
    model: 'whisper-1',
    sampleRate: 16000,
  })
  if (factory.capabilities.streaming !== 'pseudo') {
    throw new Error('factory must return the REST provider')
  }
  clearAllUserSecretOverrides()
  return `transcriptions-rest:pseudo=${factory.capabilities.streaming};finals=${finals.length}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/transcriptions-rest.probe.ts',
)
if (invokedDirectly) {
  void readTranscriptionsRestPseudoStream().then((line) => {
    process.stdout.write(`${line}\n`)
  })
}
