'use client'

import { useEffect } from 'react'

import { useNotesPublic } from '@/lib/session'

import { startOutlineOrganizer } from './organizer'

export function NotesPane() {
  useEffect(() => startOutlineOrganizer(), [])
  const version = useNotesPublic((state) => state.outlineVersion)
  const digest = useNotesPublic((state) => state.outlineDigest)

  return (
    <div className="space-y-2 text-sm">
      <p className="text-muted-foreground">大纲版本：{version}</p>
      {digest.length === 0 ? (
        <p className="text-muted-foreground">尚无大纲节点。</p>
      ) : (
        <ul className="list-disc pl-4 text-foreground">
          {digest.map((node) => (
            <li key={node.id}>{node.title}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
