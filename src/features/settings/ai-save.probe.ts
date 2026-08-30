import { getSettingsPublic, subscribeCommands } from '@/lib/session'
import { resetCommandBus } from '@/lib/session/commands'
import { resetSettingsPublic } from '@/lib/session/writes/settings'

import { sanitizeAiErrorMessage } from './ai-ping'
import { saveAiSettings } from './ai-save'
import { getAiPrivateConfig, resetAiPrivate } from './private-store'

export async function readAiSavePublishesWithoutLeakingKey(): Promise<string> {
  resetCommandBus()
  resetSettingsPublic()
  resetAiPrivate()
  const seen: string[] = []
  const stop = subscribeCommands((command) => {
    seen.push(command.type)
  })
  const secret = 'sk-probe-secret-do-not-leak'
  const result = await saveAiSettings(
    {
      baseUrl: 'https://example.invalid/v1',
      model: 'probe-model',
      apiKey: secret,
    },
    async () => ({ ok: true, message: '连通成功' }),
  )
  stop()
  const pub = getSettingsPublic()
  const snapshot = JSON.stringify(pub)
  if (snapshot.includes(secret) || snapshot.includes('apiKey')) {
    throw new Error('settings public leaked the API key')
  }
  if (!result.ok || pub.aiReady !== true || pub.aiConfigVersion !== 1) {
    throw new Error('successful ping must set aiReady and bump aiConfigVersion')
  }
  if (!seen.includes('ai.configChanged')) {
    throw new Error('save must publish ai.configChanged')
  }
  const privateConfig = getAiPrivateConfig()
  if (privateConfig.apiKey !== secret) {
    throw new Error('user override must stay in settings private memory')
  }
  const failed = await saveAiSettings(
    {
      baseUrl: 'https://example.invalid/v1',
      model: 'probe-model',
      apiKey: secret,
    },
    async () => ({ ok: false, message: '连通失败' }),
  )
  if (failed.ok || getSettingsPublic().aiReady !== false) {
    throw new Error('failed ping must keep configuration but mark not ready')
  }
  if (getSettingsPublic().aiConfigVersion !== 2) {
    throw new Error('every save must bump aiConfigVersion')
  }
  const redacted = sanitizeAiErrorMessage(`denied Bearer ${secret} sk-abcd1234`)
  if (redacted.includes(secret) || redacted.includes('sk-abcd1234')) {
    throw new Error('error messages must not keep key material')
  }
  return `settings-ai:version=${getSettingsPublic().aiConfigVersion};ready=${getSettingsPublic().aiReady}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/ai-save.probe.ts',
)
if (invokedDirectly) {
  void readAiSavePublishesWithoutLeakingKey().then((line) => {
    process.stdout.write(`${line}\n`)
  })
}
