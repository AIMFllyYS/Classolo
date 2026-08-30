import { getSettingsPublic, subscribeCommands } from '@/lib/session'
import { resetCommandBus } from '@/lib/session/commands'
import { resetSettingsPublic } from '@/lib/session/writes/settings'

import { parseExplicitAsrDraft } from './asr-config'
import { resetAsrPrivate } from './asr-private-store'
import { saveAsrSettings } from './asr-save'

export function readAsrSaveKeepsExplicitFamily(): string {
  resetCommandBus()
  resetSettingsPublic()
  resetAsrPrivate()
  const seen: string[] = []
  const stop = subscribeCommands((command) => {
    seen.push(command.type)
  })
  const secret = 'asr-probe-secret-do-not-leak'
  const misleadingUrl =
    'https://api.example.com/v1/audio/transcriptions'
  const parsed = parseExplicitAsrDraft({
    family: 'realtime-ws',
    dialect: 'stepfun',
    baseUrl: misleadingUrl,
    apiKey: secret,
    model: 'stepaudio-2.5-asr-stream',
    sampleRate: '16000',
  })
  if (!parsed.ok || parsed.family !== 'realtime-ws') {
    throw new Error('explicit family must win; never infer from URL')
  }
  const saved = saveAsrSettings({
    family: 'realtime-ws',
    dialect: 'stepfun',
    baseUrl: misleadingUrl,
    apiKey: secret,
    model: 'stepaudio-2.5-asr-stream',
    sampleRate: '16000',
  })
  if (!saved.ok) {
    throw new Error(saved.message)
  }
  const pub = JSON.stringify(getSettingsPublic())
  if (pub.includes(secret) || pub.includes('apiKey')) {
    throw new Error('settings public leaked the ASR key')
  }
  if (!seen.includes('asr.configChanged')) {
    throw new Error('save must publish asr.configChanged')
  }
  if (getSettingsPublic().asrConfigVersion !== 1) {
    throw new Error('save must bump asrConfigVersion')
  }
  const during = saveAsrSettings(
    {
      family: 'realtime-ws',
      dialect: 'stepfun',
      baseUrl: misleadingUrl,
      apiKey: secret,
      model: 'stepaudio-2.5-asr-stream',
      sampleRate: '16000',
    },
    'recording',
  )
  stop()
  if (!during.appliesNextRecording || !during.message.includes('下次录音生效')) {
    throw new Error('in-recording change must warn next recording')
  }
  if (getSettingsPublic().asrConfigVersion !== 2) {
    throw new Error('in-recording save still persists for next session')
  }
  return `settings-asr:family=${parsed.family};next=${during.appliesNextRecording}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/asr-save.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readAsrSaveKeepsExplicitFamily()}\n`)
}
