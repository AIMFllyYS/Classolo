import { motionPresets, uiPresets } from './registry'

export function readPlaybookReadyInstances(): string {
  const workbench = uiPresets.find((item) => item.id === 'workbench-shell')
  const mindmap = uiPresets.find((item) => item.id === 'classroom-mindmap')
  const enter = motionPresets.find((item) => item.id === 'mindmap-node-enter')
  if (workbench?.status !== 'ready' || mindmap?.status !== 'ready') {
    throw new Error('workbench shell and mindmap presets must be ready')
  }
  if (enter?.status !== 'ready') {
    throw new Error('mindmap enter motion must stay ready, not pretend planned')
  }
  const fake = [...uiPresets, ...motionPresets].filter(
    (item) => item.status === 'planned' && item.id === 'workbench-shell',
  )
  if (fake.length > 0) {
    throw new Error('implemented workbench must not stay planned')
  }
  return `playbook:workbench=${workbench.status};mindmap=${mindmap.status};motion=${enter.status}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/registry.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readPlaybookReadyInstances()}\n`)
}
