import { clearAllUserSecretOverrides } from '@/lib/providers/secrets'

import {
  createASRProvider,
  hotwordsForStart,
  resetHotwordPackSelection,
  resolveHotwordPack,
  selectHotwordPack,
  withHotwordPack,
} from './index'
import type { ASRCapabilities, ASRConfig, ASRProvider, ASRSegment } from './types'
import { StepfunRealtimeWsProvider, type SocketLike } from './realtime-ws/stepfun'

class FakeSocket implements SocketLike {
  readyState = 1
  sent: string[] = []
  readonly listeners = new Map<
    string,
    Array<(event: { data?: string }) => void>
  >()

  send(data: string): void {
    this.sent.push(data)
  }

  close(): void {
    this.readyState = 3
  }

  addEventListener(
    type: 'open' | 'message' | 'error' | 'close',
    listener: (event: { data?: string }) => void,
  ): void {
    const list = this.listeners.get(type) ?? []
    list.push(listener)
    this.listeners.set(type, list)
  }

  open(): void {
    for (const listener of this.listeners.get('open') ?? []) listener({})
  }
}

class UnsupportedHotwordProvider implements ASRProvider {
  readonly capabilities: ASRCapabilities = {
    streaming: 'pseudo',
    supportsHotwords: false,
    maxSessionSeconds: null,
  }

  constructor(private readonly config: ASRConfig) {}

  async start(): Promise<void> {
    const words = hotwordsForStart(this.capabilities, this.config.hotwords)
    if (words !== undefined) {
      throw new Error('unsupported family must omit hotwords')
    }
  }

  sendAudio(_chunk: ArrayBuffer): void {}

  async stop(): Promise<void> {}

  onPartial(_cb: (segment: ASRSegment) => void): void {}

  onFinal(_cb: (segment: ASRSegment) => void): void {}

  onError(_cb: (error: Error) => void): void {}
}

export async function readHotwordPackInjectsOnStart(): Promise<string> {
  clearAllUserSecretOverrides()
  resetHotwordPackSelection()
  selectHotwordPack('physics')
  const terms = resolveHotwordPack()
  if (!terms.includes('牛顿第一定律')) {
    throw new Error('physics pack must be selectable')
  }
  const config = withHotwordPack({
    family: 'realtime-ws',
    dialect: 'stepfun',
    baseUrl: 'wss://api.stepfun.com/v1/realtime/asr/stream',
    apiKey: '',
    model: 'stepaudio-2.5-asr-stream',
    sampleRate: 16000,
  })
  if (!config.hotwords?.includes('牛顿第一定律')) {
    throw new Error('selected pack must inject into ASR config')
  }

  process.env.ASR_API_KEY = 'test-asr-key'
  const socket = new FakeSocket()
  const provider = new StepfunRealtimeWsProvider(config, (url) => {
    void url
    queueMicrotask(() => socket.open())
    return socket
  })
  await provider.start()
  const update = socket.sent.find((item) => item.includes('session.update'))
  if (!update || !update.includes('牛顿第一定律')) {
    throw new Error('start must send the preset hotword pack')
  }
  await provider.stop()

  const unsupported = new UnsupportedHotwordProvider({
    ...config,
    family: 'transcriptions-rest',
    dialect: 'openai-compatible',
    hotwords: ['应被忽略'],
  })
  await unsupported.start()
  unsupported.sendAudio(new ArrayBuffer(0))
  await unsupported.stop()

  const omitted = hotwordsForStart(
    { streaming: 'pseudo', supportsHotwords: false, maxSessionSeconds: null },
    ['应被忽略'],
  )
  if (omitted !== undefined) {
    throw new Error('unsupported family must degrade by omitting hotwords')
  }

  const factory = createASRProvider({
    family: 'realtime-ws',
    dialect: 'stepfun',
    baseUrl: 'wss://api.stepfun.com/v1/realtime/asr/stream',
    apiKey: '',
    model: 'stepaudio-2.5-asr-stream',
    sampleRate: 16000,
  })
  void factory

  return `hotwords:pack=physics;injected=${terms.length};degrade=ok`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/hotwords.probe.ts',
)
if (invokedDirectly) {
  void readHotwordPackInjectsOnStart().then((line) => {
    process.stdout.write(`${line}\n`)
  })
}
