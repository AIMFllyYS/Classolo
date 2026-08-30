import { createASRProvider } from './index'
import { MISSING_ASR_SECRET_MESSAGE } from './missing-secret'
import { StepfunRealtimeWsProvider, type SocketLike } from './realtime-ws/stepfun'

class FakeSocket implements SocketLike {
  readyState = 1
  sent: string[] = []
  readonly listeners = new Map<string, Array<(event: { data?: string }) => void>>()

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

  push(data: string): void {
    for (const listener of this.listeners.get('message') ?? []) listener({ data })
  }
}

export async function readMissingAsrSecretDiagnostic(): Promise<string> {
  const saved = process.env.ASR_API_KEY
  const savedPublic = process.env.NEXT_PUBLIC_ASR_API_KEY
  delete process.env.ASR_API_KEY
  delete process.env.NEXT_PUBLIC_ASR_API_KEY
  try {
    const provider = createASRProvider({
      family: 'realtime-ws',
      dialect: 'stepfun',
      baseUrl: 'wss://example.invalid/v1/realtime/asr/stream',
      apiKey: '',
      model: 'stepaudio-2.5-asr-stream',
      sampleRate: 16000,
    })
    await provider.start()
    throw new Error('start should fail without ASR key')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('缺密钥')) {
      throw new Error(`expected 缺密钥, got ${message}`)
    }
    return message
  } finally {
    if (saved === undefined) delete process.env.ASR_API_KEY
    else process.env.ASR_API_KEY = saved
    if (savedPublic === undefined) delete process.env.NEXT_PUBLIC_ASR_API_KEY
    else process.env.NEXT_PUBLIC_ASR_API_KEY = savedPublic
  }
}

export async function readExplicitUrlAndCallbacks(): Promise<string> {
  process.env.ASR_API_KEY = 'test-asr-key'
  const socket = new FakeSocket()
  const urlUsed = { value: '' }
  const provider = new StepfunRealtimeWsProvider(
    {
      family: 'realtime-ws',
      dialect: 'stepfun',
      baseUrl: 'wss://api.stepfun.com/v1/realtime/asr/stream',
      apiKey: 'ignored-must-use-resolveSecret',
      model: 'stepaudio-2.5-asr-stream',
      sampleRate: 16000,
    },
    (url) => {
      urlUsed.value = url
      queueMicrotask(() => socket.open())
      return socket
    },
  )
  const partials: string[] = []
  const finals: string[] = []
  provider.onPartial((segment) => partials.push(segment.text))
  provider.onFinal((segment) => finals.push(segment.text))
  await provider.start()
  if (urlUsed.value !== 'wss://api.stepfun.com/v1/realtime/asr/stream') {
    throw new Error('must use explicit baseUrl, not infer from elsewhere')
  }
  provider.sendAudio(new Int16Array([0, 1, 2]).buffer)
  socket.push(
    JSON.stringify({
      type: 'conversation.item.input_audio_transcription.delta',
      text: '你好',
    }),
  )
  socket.push(
    JSON.stringify({
      type: 'conversation.item.input_audio_transcription.completed',
      text: '你好老师',
    }),
  )
  await provider.stop()
  if (partials[0] !== '你好' || finals[0] !== '你好老师') {
    throw new Error('callbacks not fired')
  }
  if (!socket.sent.some((item) => item.includes('session.update'))) {
    throw new Error('missing session.update')
  }
  if (!socket.sent.some((item) => item.includes('test-asr-key'))) {
    throw new Error('resolved ASR key was not sent on the session')
  }
  if (!socket.sent.some((item) => item.includes('input_audio_buffer.append'))) {
    throw new Error('missing audio append')
  }
  return MISSING_ASR_SECRET_MESSAGE.startsWith('缺密钥')
    ? `ws:${urlUsed.value};partials=${partials.length};finals=${finals.length}`
    : 'missing hint'
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/realtime-ws.probe.ts',
)
if (invokedDirectly) {
  void (async () => {
    const missing = await readMissingAsrSecretDiagnostic()
    const ok = await readExplicitUrlAndCallbacks()
    process.stdout.write(`${missing}\n${ok}\n`)
  })()
}
