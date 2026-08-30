import { diffOutlineLayout, layoutOutlineTree } from './layout'

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

export function readStableIdDiffKeepsPositions(): string {
  let previous: ReturnType<typeof layoutOutlineTree>['nodes'] = []
  const kept = new Map<string, { x: number; y: number }>()
  for (let i = 0; i < 20; i += 1) {
    const tree = [
      { id: 'root', title: '力学' },
      ...Array.from({ length: i + 1 }, (_, index) => ({
        id: `n${index}`,
        title: `节点${index}`,
        parentId: 'root',
      })),
    ]
    const { graph, enteredIds } = diffOutlineLayout(previous, tree)
    for (const [id, position] of kept) {
      const node = graph.nodes.find((item) => item.id === id)
      if (!node) throw new Error(`stable id ${id} disappeared`)
      if (node.position.x !== position.x || node.position.y !== position.y) {
        throw new Error(`existing node ${id} was relaid out`)
      }
    }
    if (i === 0 && enteredIds.length < 2) {
      throw new Error('first frame must enter root and first child')
    }
    if (i > 0 && !enteredIds.includes(`n${i}`)) {
      throw new Error('only the new id should enter')
    }
    for (const node of graph.nodes) {
      kept.set(node.id, node.position)
    }
    previous = graph.nodes
  }
  if (kept.has('x') || JSON.stringify([...kept.values()]).includes('cs_')) {
    throw new Error('layout must stay in memory, not cs_ tables')
  }
  return `mindmap-diff:20;kept=${kept.size}`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/layout.probe.ts',
)
if (invokedDirectly) {
  process.stdout.write(
    `${readTreeLayoutPositions()}\n${readStableIdDiffKeepsPositions()}\n`,
  )
}
