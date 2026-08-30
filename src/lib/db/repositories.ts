import { and, eq } from 'drizzle-orm'

import type { ClassoloDb } from './client'
import { ANONYMOUS_USER_ID } from './constants'
import {
  csChatMessage,
  csNoteOutline,
  csProviderProfile,
  csRenderMessage,
  csSession,
  csSetting,
  csTranscriptSegment,
  type AsrSnapshot,
  type SessionStats,
} from './schema'

function now(): Date {
  return new Date()
}

function newId(): string {
  return crypto.randomUUID()
}

function stripQueryFromUrl(url: string): string {
  const cut = url.split(/[?#]/)[0] ?? url
  return cut.trim()
}

function assertNoSecretHeaders(options: Record<string, unknown>): void {
  const headers = options.headers
  if (typeof headers !== 'object' || headers === null) return
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (key.toLowerCase() === 'authorization' || key.toLowerCase() === 'api-key') {
      throw new Error('provider options.headers must not carry secrets')
    }
    if (typeof value === 'string' && /bearer\s+/i.test(value)) {
      throw new Error('provider options.headers must not carry secrets')
    }
  }
}

export async function insertSession(
  db: ClassoloDb,
  input: {
    id?: string
    title: string
    status: 'recording' | 'paused' | 'ended' | 'interrupted'
    asrSnapshot: AsrSnapshot
    startedAt?: Date
  },
): Promise<typeof csSession.$inferSelect> {
  const at = now()
  const rows = await db
    .insert(csSession)
    .values({
      id: input.id ?? newId(),
      userId: ANONYMOUS_USER_ID,
      title: input.title,
      status: input.status,
      startedAt: input.startedAt ?? at,
      durationMs: 0,
      asrSnapshot: input.asrSnapshot,
      stats: {},
      createdAt: at,
      updatedAt: at,
    })
    .returning()
  const row = rows[0]
  if (!row) throw new Error('insert session failed')
  return row
}

export async function listSessions(db: ClassoloDb) {
  return db
    .select()
    .from(csSession)
    .where(eq(csSession.userId, ANONYMOUS_USER_ID))
}

export async function updateSession(
  db: ClassoloDb,
  id: string,
  patch: {
    status?: 'recording' | 'paused' | 'ended' | 'interrupted'
    title?: string
    endedAt?: Date | null
    durationMs?: number
    stats?: SessionStats
  },
): Promise<void> {
  await db
    .update(csSession)
    .set({
      ...patch,
      updatedAt: now(),
    })
    .where(and(eq(csSession.id, id), eq(csSession.userId, ANONYMOUS_USER_ID)))
}

export async function deleteSession(db: ClassoloDb, id: string): Promise<void> {
  await db
    .delete(csSession)
    .where(and(eq(csSession.id, id), eq(csSession.userId, ANONYMOUS_USER_ID)))
}

export async function insertTranscriptSegments(
  db: ClassoloDb,
  rows: readonly {
    id?: string
    sessionId: string
    seq: number
    startMs: number
    endMs: number
    text: string
    blockId?: string | null
  }[],
): Promise<number> {
  if (rows.length === 0) return 0
  const at = now()
  const inserted = await db
    .insert(csTranscriptSegment)
    .values(
      rows.map((row) => ({
        id: row.id ?? newId(),
        sessionId: row.sessionId,
        userId: ANONYMOUS_USER_ID,
        seq: row.seq,
        startMs: row.startMs,
        endMs: row.endMs,
        text: row.text,
        blockId: row.blockId ?? null,
        createdAt: at,
      })),
    )
    .onConflictDoNothing({
      target: [csTranscriptSegment.sessionId, csTranscriptSegment.seq],
    })
    .returning({ id: csTranscriptSegment.id })
  return inserted.length
}

export async function listTranscriptSegments(db: ClassoloDb, sessionId: string) {
  return db
    .select()
    .from(csTranscriptSegment)
    .where(
      and(
        eq(csTranscriptSegment.sessionId, sessionId),
        eq(csTranscriptSegment.userId, ANONYMOUS_USER_ID),
      ),
    )
}

export async function upsertNoteOutline(
  db: ClassoloDb,
  input: {
    sessionId: string
    outline: Record<string, unknown>
    revision: number
  },
): Promise<void> {
  await db
    .insert(csNoteOutline)
    .values({
      sessionId: input.sessionId,
      userId: ANONYMOUS_USER_ID,
      outline: input.outline,
      revision: input.revision,
      updatedAt: now(),
    })
    .onConflictDoUpdate({
      target: csNoteOutline.sessionId,
      set: {
        outline: input.outline,
        revision: input.revision,
        updatedAt: now(),
        userId: ANONYMOUS_USER_ID,
      },
    })
}

export async function getNoteOutline(db: ClassoloDb, sessionId: string) {
  const rows = await db
    .select()
    .from(csNoteOutline)
    .where(
      and(
        eq(csNoteOutline.sessionId, sessionId),
        eq(csNoteOutline.userId, ANONYMOUS_USER_ID),
      ),
    )
  return rows[0] ?? null
}

export async function insertRenderMessage(
  db: ClassoloDb,
  input: {
    id: string
    sessionId: string
    module: string
    version: string
    target: string
    props: Record<string, unknown>
    source: string
    transcriptAnchor?: string | null
    createdAt?: Date
  },
): Promise<void> {
  await db.insert(csRenderMessage).values({
    id: input.id,
    sessionId: input.sessionId,
    userId: ANONYMOUS_USER_ID,
    module: input.module,
    version: input.version,
    target: input.target,
    props: input.props,
    source: input.source,
    transcriptAnchor: input.transcriptAnchor ?? null,
    createdAt: input.createdAt ?? now(),
  })
}

export async function listRenderMessages(db: ClassoloDb, sessionId: string) {
  return db
    .select()
    .from(csRenderMessage)
    .where(
      and(
        eq(csRenderMessage.sessionId, sessionId),
        eq(csRenderMessage.userId, ANONYMOUS_USER_ID),
      ),
    )
}

export async function insertChatMessage(
  db: ClassoloDb,
  input: {
    id?: string
    sessionId: string
    seq: number
    role: 'user' | 'assistant' | 'system' | 'tool'
    content: string
    parts?: unknown
  },
): Promise<void> {
  await db.insert(csChatMessage).values({
    id: input.id ?? newId(),
    sessionId: input.sessionId,
    userId: ANONYMOUS_USER_ID,
    seq: input.seq,
    role: input.role,
    content: input.content,
    parts: input.parts ?? null,
    createdAt: now(),
  })
}

export async function listChatMessages(db: ClassoloDb, sessionId: string) {
  return db
    .select()
    .from(csChatMessage)
    .where(
      and(
        eq(csChatMessage.sessionId, sessionId),
        eq(csChatMessage.userId, ANONYMOUS_USER_ID),
      ),
    )
}

export async function insertProviderProfile(
  db: ClassoloDb,
  input: {
    id?: string
    kind: 'ai' | 'asr' | 'image-search'
    label: string
    family?: string | null
    dialect?: string | null
    baseUrl: string
    model: string
    sampleRate?: number | null
    options?: Record<string, unknown>
    credentialRef?: string | null
    hasCredential?: boolean
    isDefault?: boolean
  },
): Promise<typeof csProviderProfile.$inferSelect> {
  const options = input.options ?? {}
  assertNoSecretHeaders(options)
  const at = now()
  const rows = await db
    .insert(csProviderProfile)
    .values({
      id: input.id ?? newId(),
      userId: ANONYMOUS_USER_ID,
      kind: input.kind,
      label: input.label,
      family: input.family ?? null,
      dialect: input.dialect ?? null,
      baseUrl: stripQueryFromUrl(input.baseUrl),
      model: input.model,
      sampleRate: input.sampleRate ?? null,
      options,
      credentialRef: input.credentialRef ?? null,
      hasCredential: input.hasCredential ?? false,
      isDefault: input.isDefault ?? false,
      createdAt: at,
      updatedAt: at,
    })
    .returning()
  const row = rows[0]
  if (!row) throw new Error('insert provider profile failed')
  return row
}

export async function listProviderProfiles(db: ClassoloDb) {
  return db
    .select()
    .from(csProviderProfile)
    .where(eq(csProviderProfile.userId, ANONYMOUS_USER_ID))
}

export async function upsertSetting(
  db: ClassoloDb,
  key: string,
  value: unknown,
): Promise<void> {
  await db
    .insert(csSetting)
    .values({
      key,
      userId: ANONYMOUS_USER_ID,
      value,
      updatedAt: now(),
    })
    .onConflictDoUpdate({
      target: csSetting.key,
      set: {
        value,
        userId: ANONYMOUS_USER_ID,
        updatedAt: now(),
      },
    })
}

export async function getSetting(db: ClassoloDb, key: string) {
  const rows = await db
    .select()
    .from(csSetting)
    .where(and(eq(csSetting.key, key), eq(csSetting.userId, ANONYMOUS_USER_ID)))
  return rows[0] ?? null
}

export async function listCsTables(db: ClassoloDb): Promise<string[]> {
  const result = await db.$client.query<{ tablename: string }>(
    `select tablename from pg_tables where schemaname = 'public' and tablename like 'cs_%' order by tablename`,
  )
  return result.rows.map((row) => row.tablename)
}
