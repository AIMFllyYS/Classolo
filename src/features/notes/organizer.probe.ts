import { getNotesPublic } from '@/lib/session'
import { resetNotesPublic } from '@/lib/session/writes/notes'

import {
  getOutlineGenerateCalls,
  heuristicOutline,
  modelOutline,
  startOutlineOrganizer,
} from './organizer'

const AI_ENV_KEYS = ['AI_API_KEY', 'NEXT_PUBLIC_AI_API_KEY'] as const

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function withoutAiEnv<T>(run: () => Promise<T>): Promise<T> {
  const saved = AI_ENV_KEYS.map((key) => [key, process.env[key]] as const)
  for (const key of AI_ENV_KEYS) {
    delete process.env[key]
  }
  try {
    return await run()
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

export async function readStableHeuristicIds(): Promise<string> {
  const first = await heuristicOutline(['同一标题', '同一标题', '另一标题'])
  if (first.length !== 2) {
    throw new Error(`expected 2 unique titles, got ${first.length}`)
  }
  if (first.some((node) => !node.id || !node.title)) {
    throw new Error('digest must have stable id+title')
  }
  if (first.some((node) => 'x' in node || 'y' in node)) {
    throw new Error('digest must not include coordinates')
  }
  const again = await heuristicOutline(['同一标题'])
  if (again[0]?.id !== first[0]?.id) {
    throw new Error('same title must keep the same id')
  }
  return `heuristic:${first.length}`
}

export async function readModelOutlineFallsBackWithoutSecret(): Promise<string> {
  return withoutAiEnv(async () => {
    const nodes = await modelOutline(['动能定理'])
    if (nodes.length !== 1 || !nodes[0]?.id || nodes[0].title.length === 0) {
      throw new Error('missing AI secret must fall back to heuristic nodes')
    }
    return `model-fallback:${nodes[0].id}`
  })
}

export async function readDebouncedStableOutline(): Promise<string> {
  resetNotesPublic()
  const texts = ['牛顿第一定律', '牛顿第二定律']
  let calls = 0
  const listeners: Array<() => void> = []
  const stop = startOutlineOrganizer({
    debounceMs: 20,
    generate: async (incoming) => {
      calls += 1
      return heuristicOutline(incoming)
    },
    subscribeCommitted: (onCommitted) => {
      listeners.push(onCommitted)
      return () => {
        const index = listeners.indexOf(onCommitted)
        if (index >= 0) listeners.splice(index, 1)
      }
    },
    readTexts: () => texts,
  })
  for (const listener of listeners) listener()
  for (const listener of listeners) listener()
  await delay(60)
  stop()
  const digest = getNotesPublic().outlineDigest
  if (calls !== 1 && getOutlineGenerateCalls() < 1) {
    throw new Error('organizer never ran')
  }
  if (calls !== 1) {
    throw new Error(`expected 1 generate after debounce, got ${calls}`)
  }
  if (digest.length === 0 || digest.some((node) => !node.id || !node.title)) {
    throw new Error('digest must have stable id+title')
  }
  const snapshot = JSON.stringify(getNotesPublic())
  if (snapshot.includes('x:') || snapshot.includes('apiKey')) {
    throw new Error('notes public leaked coords or keys')
  }
  return `outline:${digest.length};calls=${calls};version=${getNotesPublic().outlineVersion}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/organizer.probe.ts',
)
if (invokedDirectly) {
  void (async () => {
    const lines = [
      await readStableHeuristicIds(),
      await readModelOutlineFallsBackWithoutSecret(),
      await readDebouncedStableOutline(),
    ]
    process.stdout.write(`${lines.join('\n')}\n`)
  })()
}
