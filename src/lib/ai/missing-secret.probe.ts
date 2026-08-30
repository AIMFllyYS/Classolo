import {
  createModel,
  MissingAISecretError,
  MISSING_AI_SECRET_MESSAGE,
} from './create-model'

const AI_ENV_KEYS = ['AI_API_KEY', 'NEXT_PUBLIC_AI_API_KEY'] as const

function withoutAiEnv<T>(run: () => T): T {
  const saved = AI_ENV_KEYS.map((key) => [key, process.env[key]] as const)
  for (const key of AI_ENV_KEYS) {
    delete process.env[key]
  }
  try {
    return run()
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

/** Drives shipped createModel(); missing key must surface 缺密钥. */
export function readCreateModelMissingSecretDiagnostic(): string {
  return withoutAiEnv(() => {
    try {
      createModel({
        baseUrl: 'https://example.invalid/v1',
        model: 'classolo-probe',
        userOverride: null,
      })
    } catch (error) {
      if (error instanceof MissingAISecretError) {
        return error.message
      }
      throw error
    }
    throw new Error('createModel did not fail without an AI secret')
  })
}

export function createModelWithUserOverride() {
  return withoutAiEnv(() =>
    createModel({
      baseUrl: 'https://example.invalid/v1',
      model: 'classolo-probe',
      userOverride: 'sk-user-override',
    }),
  )
}

export { MISSING_AI_SECRET_MESSAGE }

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/missing-secret.probe.ts',
)
if (invokedDirectly) {
  const diagnostic = readCreateModelMissingSecretDiagnostic()
  if (diagnostic !== MISSING_AI_SECRET_MESSAGE) {
    throw new Error(`unexpected diagnostic: ${diagnostic}`)
  }
  const model = createModelWithUserOverride()
  if (typeof model !== 'object' || model === null) {
    throw new Error('user override must still construct a model')
  }
  process.stdout.write(`${diagnostic}\n`)
}
