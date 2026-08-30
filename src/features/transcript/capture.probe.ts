import { getTranscriptPublic } from '@/lib/session'
import { resetTranscriptPublic } from '@/lib/session/writes/transcript'

import { startCapture } from './capture'
import { getTranscriptPrivate, resetTranscriptPrivate } from './private-store'
import { resampleTo16k, TARGET_SAMPLE_RATE } from './resample'

export function readResampleTo16k(): string {
  const inputRate = 48000
  const seconds = 0.01
  const input = new Float32Array(Math.round(inputRate * seconds))
  input.fill(0.5)
  const output = resampleTo16k(input, inputRate)
  const expected = Math.floor(input.length / (inputRate / TARGET_SAMPLE_RATE))
  if (output.length !== expected) {
    throw new Error(`expected ${expected} samples, got ${output.length}`)
  }
  return `resample:${input.length}->${output.length}`
}

export async function readPermissionDeniedDiagnostic(): Promise<string> {
  resetTranscriptPrivate()
  resetTranscriptPublic()
  await startCapture({
    getUserMedia: async () => {
      const error = new Error('denied')
      error.name = 'NotAllowedError'
      throw error
    },
    AudioContext: class {
      constructor() {
        throw new Error('AudioContext should not start after denial')
      }
    } as unknown as typeof AudioContext,
  })
  const priv = getTranscriptPrivate()
  const pub = getTranscriptPublic()
  if (priv.error !== '麦克风权限被拒绝') {
    throw new Error(`unexpected private error: ${priv.error}`)
  }
  const pubJson = JSON.stringify(pub)
  if (pubJson.includes('level') || pubJson.includes('MediaStream')) {
    throw new Error('public slice leaked capture handles or level')
  }
  return priv.error
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/capture.probe.ts',
)
if (invokedDirectly) {
  const resample = readResampleTo16k()
  void readPermissionDeniedDiagnostic().then((denied) => {
    process.stdout.write(`${resample}\n${denied}\n`)
  })
}
