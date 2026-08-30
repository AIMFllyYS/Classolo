import { resolveRenderView } from '../dispatch'
import type { RenderModuleRegistry } from '../manifest'

import { imageModule } from './manifest'
import { searchClassroomImage } from './search'

const IMAGE_ENV_KEYS = [
  'IMAGE_SEARCH_API_KEY',
  'NEXT_PUBLIC_IMAGE_SEARCH_API_KEY',
] as const

async function withoutImageEnv<T>(run: () => Promise<T>): Promise<T> {
  const saved = IMAGE_ENV_KEYS.map((key) => [key, process.env[key]] as const)
  for (const key of IMAGE_ENV_KEYS) {
    delete process.env[key]
  }
  try {
    return await run()
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

export async function readImageModuleStates(): Promise<string> {
  if (imageModule.toolName !== 'render_image') {
    throw new Error('image module must be registered')
  }
  const registry = { image: imageModule } as RenderModuleRegistry
  const invalid = resolveRenderView(
    {
      id: 'img-bad',
      module: 'image',
      version: '1.0',
      target: 'notes',
      props: { query: 1 },
      meta: { createdAt: 1, source: 'system' },
    },
    registry,
  )
  if (invalid.ok) {
    throw new Error('illegal image props must fail validation')
  }
  const valid = resolveRenderView(
    {
      id: 'img-ok',
      module: 'image',
      version: '1.0',
      target: 'transcript',
      props: { query: 'neuron' },
      meta: { createdAt: 1, source: 'silent-agent' },
    },
    registry,
  )
  if (!valid.ok) {
    throw new Error('legal image props must dispatch')
  }
  const missing = await withoutImageEnv(() => searchClassroomImage('neuron'))
  if (missing.status !== 'error' || !missing.message.includes('缺密钥')) {
    throw new Error('missing image-search secret must be a visible error state')
  }
  const empty = await searchClassroomImage('  ')
  if (empty.status !== 'empty') {
    throw new Error('blank query must be empty state')
  }
  const leak = JSON.stringify({ missing, valid })
  if (leak.includes('apiKey') || leak.includes('Client-ID')) {
    throw new Error('image search leaked credentials')
  }
  return `image-module:registered;missing=${missing.status};empty=${empty.status}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/search.probe.ts',
)
if (invokedDirectly) {
  void readImageModuleStates().then((line) => {
    process.stdout.write(`${line}\n`)
  })
}
