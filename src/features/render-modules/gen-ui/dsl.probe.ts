import { parseGenUiDsl } from './dsl'

export function readGenUiRejectsUnsafeDsl(): string {
  const ok = parseGenUiDsl({
    type: 'stack',
    children: [
      { type: 'text', text: '牛顿定律' },
      { type: 'kpi', label: '定律数', value: '3' },
    ],
  })
  if (!ok.ok) throw new Error('whitelist DSL must parse')
  const unknown = parseGenUiDsl({ type: 'iframe', src: 'javascript:alert(1)' })
  if (unknown.ok || !unknown.error.includes('白名单外')) {
    throw new Error('unknown components must be rejected')
  }
  const code = parseGenUiDsl('function(){return 1}')
  if (code.ok) {
    throw new Error('arbitrary code strings must not execute')
  }
  return `gen-ui:ok=${ok.node.type};reject=${unknown.error}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/dsl.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readGenUiRejectsUnsafeDsl()}\n`)
}
