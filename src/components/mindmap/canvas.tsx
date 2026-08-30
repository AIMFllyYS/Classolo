'use client'

import { useMemo } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { cn } from '@/lib/utils'

import { ClassroomOutlineNode } from './classroom-outline-node'
import {
  layoutOutlineTree,
  type OutlineTreeNode,
} from './layout'

const nodeTypes = {
  classroomOutline: ClassroomOutlineNode,
} satisfies NodeTypes

export interface ClassroomMindmapProps {
  nodes: readonly OutlineTreeNode[]
  className?: string
  onNodeClick?: (id: string) => void
}

function MindmapFlow({ nodes, className, onNodeClick }: ClassroomMindmapProps) {
  const graph = useMemo(() => layoutOutlineTree(nodes), [nodes])
  const flowNodes: Node[] = useMemo(
    () =>
      graph.nodes.map((node) => ({
        id: node.id,
        type: 'classroomOutline',
        position: node.position,
        data: { title: node.title },
        draggable: false,
      })),
    [graph],
  )
  const flowEdges: Edge[] = useMemo(
    () =>
      graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })),
    [graph],
  )

  return (
    <div className={cn('h-full min-h-64 w-full', className)}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        fitView
        minZoom={0.25}
        maxZoom={2}
        colorMode="system"
        defaultEdgeOptions={{ type: 'smoothstep' }}
        onNodeClick={(_event, node) => {
          onNodeClick?.(node.id)
        }}
      >
        <Background gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}

export function ClassroomMindmap(props: ClassroomMindmapProps) {
  return (
    <ReactFlowProvider>
      <MindmapFlow {...props} />
    </ReactFlowProvider>
  )
}
