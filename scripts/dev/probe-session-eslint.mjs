import { execFileSync } from 'node:child_process'
import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const probeDir = path.join(root, 'src/features/playbook')

const cases = [
  {
    name: 'cross-feature',
    file: path.join(probeDir, '_eslint-boundary.probe.ts'),
    source: `import type { RenderMessage } from '@/features/render-modules/types'\nexport type Probe = RenderMessage\n`,
  },
  {
    name: 'writes-from-playbook',
    file: path.join(probeDir, '_eslint-writes.probe.ts'),
    source: `import { appendCommitted } from '@/lib/session/writes/transcript'\nexport const probe = appendCommitted\n`,
  },
]

mkdirSync(probeDir, { recursive: true })

for (const probe of cases) {
  writeFileSync(probe.file, probe.source, 'utf8')
  let status = 0
  let output = ''
  try {
    try {
      execFileSync('pnpm', ['exec', 'eslint', probe.file], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      })
      status = 0
      output = 'eslint exited 0 (expected non-zero)\n'
    } catch (error) {
      status = typeof error.status === 'number' ? error.status : 1
      output = `${error.stdout ?? ''}${error.stderr ?? ''}`
    }
  } finally {
    try {
      unlinkSync(probe.file)
    } catch {
      // ignore
    }
  }
  if (status === 0) {
    process.stderr.write(output)
    throw new Error(`expected eslint to fail for ${probe.name}`)
  }
}

process.stdout.write('session-eslint-boundary: forbidden imports failed lint\n')
