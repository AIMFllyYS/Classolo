import {
  createASRProvider,
  getCustomHotwords,
  mergeHotwords,
  parseCustomHotwordText,
  resetCustomHotwords,
  resetHotwordPackSelection,
  resolveHotwordPack,
  selectHotwordPack,
  setCustomHotwords,
  withHotwordPack,
} from './index'
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

export async function readCustomHotwordsOverlayPack(): Promise<string> {
  resetCustomHotwords()
  resetHotwordPackSelection()
  selectHotwordPack('physics')

  const parsed = parseCustomHotwordText(' 法拉第电磁感应定律 \n牛顿第一定律，自定义词')
  if (
    parsed[0] !== '法拉第电磁感应定律' ||
    parsed[1] !== '牛顿第一定律' ||
    parsed[2] !== '自定义词' ||
    parsed.length !== 3
  ) {
    throw new Error('custom text must split, trim, and keep first-seen order')
  }

  setCustomHotwords(['法拉第电磁感应定律', '牛顿第一定律'])
  const merged = mergeHotwords(resolveHotwordPack('physics'), getCustomHotwords())
  if (!merged.includes('牛顿第一定律') || !merged.includes('法拉第电磁感应定律')) {
    throw new Error('custom hotwords must overlay the preset pack')
  }
  if (merged.filter((word) => word === '牛顿第一定律').length !== 1) {
    throw new Error('pack and custom must unique-merge')
  }

  const config = withHotwordPack({
    family: 'realtime-ws',
    dialect: 'stepfun',
    baseUrl: 'wss://api.stepfun.com/v1/realtime/asr/stream',
    apiKey: '',
    model: 'stepaudio-2.5-asr-stream',
    sampleRate: 16000,
  })
  if (!config.hotwords?.includes('法拉第电磁感应定律')) {
    throw new Error('withHotwordPack must inject custom overlay')
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
  if (!update || !update.includes('法拉第电磁感应定律')) {
    throw new Error('next start must send custom hotwords')
  }
  await provider.stop()

  resetCustomHotwords()
  const cleared = withHotwordPack({
    family: 'realtime-ws',
    dialect: 'stepfun',
    baseUrl: 'wss://api.stepfun.com/v1/realtime/asr/stream',
    apiKey: '',
    model: 'stepaudio-2.5-asr-stream',
    sampleRate: 16000,
  })
  if (cleared.hotwords?.includes('法拉第电磁感应定律')) {
    throw new Error('reset must drop custom overlay')
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

  return `custom-hotwords:overlay=${merged.length};injected=ok`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/custom-hotwords.probe.ts',
)
if (invokedDirectly) {
  void readCustomHotwordsOverlayPack().then((line) => {
    process.stdout.write(`${line}\n`)
  })
}
