import { getNotesPublic, getTranscriptPublic } from '@/lib/session'

import {
  getChatPrivate,
  resetChatPrivate,
  toggleChatOpen,
} from './chat-store'
import { runChatTurn } from './chat-turn'

export async function readChatPanelDoesNotPersistLayout(): Promise<string> {
  resetChatPrivate()
  const before = Object.keys(globalThis.localStorage ?? {})
  toggleChatOpen()
  if (!getChatPrivate().open) {
    throw new Error('chat panel must toggle open')
  }
  toggleChatOpen()
  const after = Object.keys(globalThis.localStorage ?? {})
  if (after.some((key) => key.includes('chatOpen') || key.includes('layout'))) {
    throw new Error('chatOpen must not write layout persistence keys')
  }
  void before
  async function* fake() {
    yield { reasoning: '先看提纲' }
    yield { text: '答' }
    yield { text: '案' }
  }
  await runChatTurn('什么是惯性', fake)
  const priv = getChatPrivate()
  if (priv.answer !== '答案' || priv.streaming) {
    throw new Error('stream deltas must assemble in memory')
  }
  const pub = `${JSON.stringify(getNotesPublic())}${JSON.stringify(getTranscriptPublic())}`
  if (pub.includes('答案') || pub.includes('先看提纲') || pub.includes('chatOpen')) {
    throw new Error('streaming chat must not leak into public slices')
  }
  return `agent-chat:open-toggle;stream=${priv.answer}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/chat.probe.ts',
)
if (invokedDirectly) {
  void readChatPanelDoesNotPersistLayout().then((line) => {
    process.stdout.write(`${line}\n`)
  })
}
