import { getAiRuntimeConfig, setAiRuntimeConfig } from '@/lib/ai'
import {
  clearAllUserSecretOverrides,
  setUserSecretOverride,
} from '@/lib/providers/secrets'
import { publishCommand } from '@/lib/session'
import { resetCommandBus } from '@/lib/session/commands'

import {
  bindAiConfigConsumer,
  getChatModel,
  invalidateChatModel,
} from './chat-model'
import { resetChatPersistSeq } from './chat-persist'
import { getChatPrivate, resetChatPrivate } from './chat-store'
import { runChatTurn } from './chat-turn'

export async function readChatConsumesConfigAndPersistsTerminal(): Promise<string> {
  resetCommandBus()
  bindAiConfigConsumer()
  resetChatPrivate()
  resetChatPersistSeq()
  invalidateChatModel()
  clearAllUserSecretOverrides()
  setUserSecretOverride('ai', 'probe-ai-secret')
  setAiRuntimeConfig({
    baseUrl: 'https://old.example/v1',
    model: 'old-model',
  })
  const first = getChatModel()
  if (getChatModel() !== first) {
    throw new Error('chat model must be reused until config changes')
  }
  setAiRuntimeConfig({
    baseUrl: 'https://new.example/v1',
    model: 'new-model',
  })
  if (getChatModel() !== first) {
    throw new Error('without ai.configChanged the cached instance must stay')
  }
  publishCommand({ type: 'ai.configChanged', source: 'settings' })
  const next = getChatModel()
  if (next === first) {
    throw new Error('ai.configChanged must drop the cached model')
  }
  if (getAiRuntimeConfig().model !== 'new-model') {
    throw new Error('next turn must read the saved runtime model')
  }

  const persistLog: string[] = []
  let streamCalls = 0
  async function* flaky(prompt: string) {
    void prompt
    streamCalls += 1
    if (streamCalls < 3) {
      throw new Error('429 Too Many Requests')
    }
    yield { text: '终' }
    yield { text: '态' }
  }
  await runChatTurn('什么是惯性', flaky, {
    persist: async (record) => {
      persistLog.push(`${record.role}:${record.content}`)
    },
    sleep: async () => undefined,
  })
  if (streamCalls !== 3) {
    throw new Error('rate limit must retry then succeed')
  }
  if (getChatPrivate().answer !== '终态' || getChatPrivate().error) {
    throw new Error('successful retry must assemble the terminal answer')
  }
  if (persistLog.join('|') !== 'user:什么是惯性|assistant:终态') {
    throw new Error(
      `terminal persist only, got ${persistLog.join('|')}`,
    )
  }

  resetChatPrivate()
  async function* failing() {
    throw new Error('fetch failed')
  }
  await runChatTurn('还在吗', failing, {
    persist: async (record) => {
      persistLog.push(`fail:${record.role}:${record.content}`)
    },
    sleep: async () => undefined,
  })
  const err = getChatPrivate().error
  if (!err || !err.includes('网络') || getChatPrivate().streaming) {
    throw new Error('network failure must be readable and not blank the panel')
  }
  if (!persistLog.some((item) => item.includes('fail:assistant:') && item.includes('网络'))) {
    throw new Error('failed turn still persists a terminal assistant row')
  }

  return `agent-config:model=${getAiRuntimeConfig().model};retry=${streamCalls};error=readable`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/chat-config.probe.ts',
)
if (invokedDirectly) {
  void readChatConsumesConfigAndPersistsTerminal().then((line) => {
    process.stdout.write(`${line}\n`)
  })
}
