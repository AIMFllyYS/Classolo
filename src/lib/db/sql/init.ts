/** Versioned init DDL. Re-run skips when `cs_session` already exists. */
export const INIT_MIGRATION_ID = '0001_cs_tables'

export const INIT_SQL = `
CREATE TABLE cs_session (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  duration_ms integer NOT NULL DEFAULT 0,
  asr_snapshot jsonb NOT NULL,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT ck_session_status CHECK (status IN ('recording', 'paused', 'ended', 'interrupted'))
);
CREATE INDEX idx_session_user_started ON cs_session (user_id, started_at DESC);

CREATE TABLE cs_transcript_segment (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES cs_session(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  seq integer NOT NULL,
  start_ms integer NOT NULL,
  end_ms integer NOT NULL,
  text text NOT NULL,
  block_id uuid,
  asr_meta jsonb,
  created_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX uq_transcript_segment_session_seq ON cs_transcript_segment (session_id, seq);
CREATE INDEX idx_transcript_segment_session_time ON cs_transcript_segment (session_id, start_ms);
CREATE INDEX idx_transcript_segment_block ON cs_transcript_segment (session_id, block_id) WHERE block_id IS NOT NULL;

CREATE TABLE cs_note_outline (
  session_id uuid PRIMARY KEY REFERENCES cs_session(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  outline jsonb NOT NULL,
  revision integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL
);

CREATE TABLE cs_render_message (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES cs_session(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  module text NOT NULL,
  version text NOT NULL,
  target text NOT NULL,
  props jsonb NOT NULL,
  source text NOT NULL,
  transcript_anchor uuid REFERENCES cs_transcript_segment(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT ck_render_message_module CHECK (module IN ('image', 'rich-text', 'ai-ask', 'gen-ui', 'agent-status')),
  CONSTRAINT ck_render_message_target CHECK (target IN ('transcript', 'notes')),
  CONSTRAINT ck_render_message_source CHECK (source IN ('silent-agent', 'chat-agent', 'system'))
);
CREATE INDEX idx_render_message_session_time ON cs_render_message (session_id, created_at);

CREATE TABLE cs_chat_message (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES cs_session(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  seq integer NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  parts jsonb,
  created_at timestamptz NOT NULL,
  CONSTRAINT ck_chat_message_role CHECK (role IN ('user', 'assistant', 'system', 'tool'))
);
CREATE UNIQUE INDEX uq_chat_message_session_seq ON cs_chat_message (session_id, seq);

CREATE TABLE cs_provider_profile (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  label text NOT NULL,
  family text,
  dialect text,
  base_url text NOT NULL,
  model text NOT NULL,
  sample_rate integer,
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  credential_ref text,
  has_credential boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT ck_provider_profile_kind CHECK (kind IN ('ai', 'asr', 'image-search'))
);
CREATE INDEX idx_provider_profile_user_kind ON cs_provider_profile (user_id, kind);
CREATE UNIQUE INDEX uq_provider_profile_default ON cs_provider_profile (user_id, kind) WHERE is_default;

CREATE TABLE cs_setting (
  key text PRIMARY KEY,
  user_id uuid NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL
);
`
