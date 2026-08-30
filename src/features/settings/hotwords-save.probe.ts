import {
  getCustomHotwords,
  getSelectedHotwordPackId,
  resetCustomHotwords,
  resetHotwordPackSelection,
} from '@/lib/providers/asr'
import { getSettingsPublic, subscribeCommands } from '@/lib/session'
import { resetCommandBus } from '@/lib/session/commands'
import { resetSettingsPublic } from '@/lib/session/writes/settings'

import { saveHotwordSettings } from './hotwords-save'

export function readHotwordSaveOverlaysAndBumpsVersion(): string {
  resetCommandBus()
  resetSettingsPublic()
  resetCustomHotwords()
  resetHotwordPackSelection()
  const seen: string[] = []
  const stop = subscribeCommands((command) => {
    seen.push(command.type)
  })
  const unknown = saveHotwordSettings({
    packId: 'not-a-pack',
    customText: '应被拒绝',
  })
  if (unknown.ok) {
    throw new Error('unknown pack must fail closed')
  }
  const saved = saveHotwordSettings({
    packId: 'medicine',
    customText: '降钙素\n自定义热词探针',
  })
  if (!saved.ok || !saved.hotwords.includes('自定义热词探针')) {
    throw new Error('save must overlay custom terms on the pack')
  }
  if (!saved.hotwords.includes('心肌梗死')) {
    throw new Error('medicine pack terms must remain')
  }
  if (getSelectedHotwordPackId() !== 'medicine') {
    throw new Error('save must select the preset pack')
  }
  if (!getCustomHotwords().includes('自定义热词探针')) {
    throw new Error('custom terms must persist for the next recording config')
  }
  if (!seen.includes('asr.configChanged')) {
    throw new Error('save must publish asr.configChanged')
  }
  if (getSettingsPublic().hotwordsVersion !== 1) {
    throw new Error('save must bump hotwordsVersion')
  }
  const snapshot = JSON.stringify(getSettingsPublic())
  if (snapshot.includes('自定义热词探针')) {
    throw new Error('settings public must not carry hotword text')
  }
  const during = saveHotwordSettings(
    {
      packId: 'physics',
      customText: '动能定理',
    },
    'recording',
  )
  stop()
  if (!during.appliesNextRecording || !during.message.includes('下次录音生效')) {
    throw new Error('in-recording change must warn next recording')
  }
  if (getSettingsPublic().hotwordsVersion !== 2) {
    throw new Error('in-recording save still persists for next session')
  }
  resetCustomHotwords()
  resetHotwordPackSelection()
  return `settings-hotwords:pack=medicine;next=${during.appliesNextRecording}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/hotwords-save.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readHotwordSaveOverlaysAndBumpsVersion()}\n`)
}
