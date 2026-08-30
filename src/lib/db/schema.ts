import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export interface AsrSnapshot {
  family: string
  dialect: string
  model: string
  baseUrl: string
  sampleRate: number
  hotwordPack?: string
}

export interface SessionStats {
  segmentCount?: number
  charCount?: number
  renderMessageCount?: number
  chatTurnCount?: number
}

export interface AsrSegmentMeta {
  dialect?: string
  confidence?: number
  hotwordHits?: string[]
  revisedFrom?: string
}

export const csSession = pgTable(
  'cs_session',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    title: text('title').notNull(),
    status: text('status').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    durationMs: integer('duration_ms').notNull().default(0),
    asrSnapshot: jsonb('asr_snapshot').$type<AsrSnapshot>().notNull(),
    stats: jsonb('stats').$type<SessionStats>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    index('idx_session_user_started').on(t.userId, t.startedAt.desc()),
    check(
      'ck_session_status',
      sql`status in ('recording', 'paused', 'ended', 'interrupted')`,
    ),
  ],
)

export const csTranscriptSegment = pgTable(
  'cs_transcript_segment',
  {
    id: uuid('id').primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => csSession.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    seq: integer('seq').notNull(),
    startMs: integer('start_ms').notNull(),
    endMs: integer('end_ms').notNull(),
    text: text('text').notNull(),
    blockId: uuid('block_id'),
    asrMeta: jsonb('asr_meta').$type<AsrSegmentMeta>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex('uq_transcript_segment_session_seq').on(t.sessionId, t.seq),
    index('idx_transcript_segment_session_time').on(t.sessionId, t.startMs),
    index('idx_transcript_segment_block')
      .on(t.sessionId, t.blockId)
      .where(sql`${t.blockId} is not null`),
  ],
)

export const csNoteOutline = pgTable('cs_note_outline', {
  sessionId: uuid('session_id')
    .primaryKey()
    .references(() => csSession.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  outline: jsonb('outline').$type<Record<string, unknown>>().notNull(),
  revision: integer('revision').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
})

export const csRenderMessage = pgTable(
  'cs_render_message',
  {
    id: uuid('id').primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => csSession.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    module: text('module').notNull(),
    version: text('version').notNull(),
    target: text('target').notNull(),
    props: jsonb('props').$type<Record<string, unknown>>().notNull(),
    source: text('source').notNull(),
    transcriptAnchor: uuid('transcript_anchor').references(
      () => csTranscriptSegment.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    index('idx_render_message_session_time').on(t.sessionId, t.createdAt),
    check(
      'ck_render_message_module',
      sql`module in ('image', 'rich-text', 'ai-ask', 'gen-ui', 'agent-status')`,
    ),
    check('ck_render_message_target', sql`target in ('transcript', 'notes')`),
    check(
      'ck_render_message_source',
      sql`source in ('silent-agent', 'chat-agent', 'system')`,
    ),
  ],
)

export const csChatMessage = pgTable(
  'cs_chat_message',
  {
    id: uuid('id').primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => csSession.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    seq: integer('seq').notNull(),
    role: text('role').notNull(),
    content: text('content').notNull(),
    parts: jsonb('parts').$type<unknown>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex('uq_chat_message_session_seq').on(t.sessionId, t.seq),
    check(
      'ck_chat_message_role',
      sql`role in ('user', 'assistant', 'system', 'tool')`,
    ),
  ],
)

export const csProviderProfile = pgTable(
  'cs_provider_profile',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull(),
    kind: text('kind').notNull(),
    label: text('label').notNull(),
    family: text('family'),
    dialect: text('dialect'),
    baseUrl: text('base_url').notNull(),
    model: text('model').notNull(),
    sampleRate: integer('sample_rate'),
    options: jsonb('options')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    credentialRef: text('credential_ref'),
    hasCredential: boolean('has_credential').notNull().default(false),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    index('idx_provider_profile_user_kind').on(t.userId, t.kind),
    uniqueIndex('uq_provider_profile_default')
      .on(t.userId, t.kind)
      .where(sql`${t.isDefault}`),
    check(
      'ck_provider_profile_kind',
      sql`kind in ('ai', 'asr', 'image-search')`,
    ),
  ],
)

export const csSetting = pgTable('cs_setting', {
  key: text('key').primaryKey(),
  userId: uuid('user_id').notNull(),
  value: jsonb('value').$type<unknown>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
})

export const schema = {
  csSession,
  csTranscriptSegment,
  csNoteOutline,
  csRenderMessage,
  csChatMessage,
  csProviderProfile,
  csSetting,
}
