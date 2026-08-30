'use client'

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'

import { cn } from '@/lib/utils'

export type ClassroomOutlineNodeData = {
  title: string
}

export type ClassroomOutlineFlowNode = Node<
  ClassroomOutlineNodeData,
  'classroomOutline'
>

export function ClassroomOutlineNode({
  data,
  selected,
}: NodeProps<ClassroomOutlineFlowNode>) {
  return (
    <div
      className={cn(
        'min-w-40 max-w-56 rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground shadow-sm',
        selected && 'ring-2 ring-ring',
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-border !bg-primary"
      />
      <p className="font-medium leading-snug">{data.title}</p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-border !bg-primary"
      />
    </div>
  )
}
