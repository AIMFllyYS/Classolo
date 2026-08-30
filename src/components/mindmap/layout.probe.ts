import { layoutOutlineTree } from './layout'

export function readTreeLayoutPositions(): string {
  const graph = layoutOutlineTree([
    { id: 'root', title: '力学' },
    { id: 'n1', title: '牛顿第一定律', parentId: 'root' },
    { id: 'n2', title: '牛顿第二定律', parentId: 'root' },
  ])
  if (graph.nodes.length !== 3) {
    throw new Error(`expected 3 laid-out nodes, got ${graph.nodes.length}`)
  }
  if (graph.edges.length !== 2) {
    throw new Error(`expected 2 tree edges, got ${graph.edges.length}`)
  }
  if (
    graph.nodes.some(
      (node) =>
        !Number.isFinite(node.position.x) || !Number.isFinite(node.position.y),
    )
  ) {
    throw new Error('dagre must assign finite x/y')
  }
  const root = graph.nodes.find((node) => node.id === 'root')
  const child = graph.nodes.find((node) => node.id === 'n1')
  if (!root || !child) {
    throw new Error('layout dropped stable ids')
  }
  if (child.position.y <= root.position.y) {
    throw new Error('TB tree layout must place children below the parent')
  }
  const ids = new Set(graph.nodes.map((node) => node.id))
  if (ids.size !== 3) {
    throw new Error('layout must keep stable unique ids')
  }
  return `mindmap-layout:${graph.nodes.length};dy=${child.position.y - root.position.y}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/layout.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(`${readTreeLayoutPositions()}\n`)
}
