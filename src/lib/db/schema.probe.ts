import {
  ANONYMOUS_USER_ID,
  ANONYMOUS_USER_SETTING_KEY,
  deleteSession,
  getNoteOutline,
  getSetting,
  insertChatMessage,
  insertProviderProfile,
  insertRenderMessage,
  insertSession,
  insertTranscriptSegments,
  listChatMessages,
  listCsTables,
  listProviderProfiles,
  listRenderMessages,
  listTranscriptSegments,
  openDatabase,
  upsertNoteOutline,
  upsertSetting,
} from './index'

const SECRET = 'sk-must-never-land-in-cs-tables'

export async function readCsTablesAndAnonymousUser(): Promise<string> {
  const db = await openDatabase()
  await db.$client.waitReady
  const first = await listCsTables(db)
  const expected = [
    'cs_chat_message',
    'cs_note_outline',
    'cs_provider_profile',
    'cs_render_message',
    'cs_session',
    'cs_setting',
    'cs_transcript_segment',
  ]
  if (first.join() !== expected.join()) {
    throw new Error(`unexpected tables: ${first.join(',')}`)
  }
  if (first.includes('cs_user')) {
    throw new Error('cs_user must not exist')
  }

  const { applyInitMigration } = await import('./migrate')
  await applyInitMigration(db.$client)
  await applyInitMigration(db.$client)

  const anon = await getSetting(db, ANONYMOUS_USER_SETTING_KEY)
  if (anon?.value !== ANONYMOUS_USER_ID) {
    throw new Error('anonymous user id must be seeded into cs_setting')
  }

  const session = await insertSession(db, {
    title: 'probe class',
    status: 'recording',
    asrSnapshot: {
      family: 'realtime-ws',
      dialect: 'stepfun',
      model: 'stepaudio-2.5-asr-stream',
      baseUrl: 'wss://api.stepfun.com/v1/realtime/asr/stream',
      sampleRate: 16000,
      hotwordPack: 'physics',
    },
  })
  const written = await insertTranscriptSegments(db, [
    {
      sessionId: session.id,
      seq: 0,
      startMs: 0,
      endMs: 1200,
      text: '牛顿第一定律',
    },
  ])
  if (written !== 1) throw new Error('first segment insert must write 1 row')
  const replay = await insertTranscriptSegments(db, [
    {
      sessionId: session.id,
      seq: 0,
      startMs: 0,
      endMs: 1200,
      text: 'should be ignored',
    },
  ])
  if (replay !== 0) throw new Error('duplicate seq must be idempotent')
  const segments = await listTranscriptSegments(db, session.id)
  if (segments.length !== 1 || segments[0]?.text !== '牛顿第一定律') {
    throw new Error('idempotent insert must keep the first final text')
  }

  await upsertNoteOutline(db, {
    sessionId: session.id,
    outline: { root: { id: 'n1', text: '力', children: [] } },
    revision: 1,
  })
  const outline = await getNoteOutline(db, session.id)
  if (outline?.revision !== 1) throw new Error('outline upsert failed')

  await insertRenderMessage(db, {
    id: crypto.randomUUID(),
    sessionId: session.id,
    module: 'rich-text',
    version: '1.0',
    target: 'notes',
    props: { markdown: 'ok' },
    source: 'system',
    transcriptAnchor: segments[0]?.id,
  })
  await insertChatMessage(db, {
    sessionId: session.id,
    seq: 0,
    role: 'user',
    content: '这节课在讲什么',
  })
  if ((await listRenderMessages(db, session.id)).length !== 1) {
    throw new Error('render message insert failed')
  }
  if ((await listChatMessages(db, session.id)).length !== 1) {
    throw new Error('chat message insert failed')
  }

  const profile = await insertProviderProfile(db, {
    kind: 'asr',
    label: 'stepfun',
    family: 'realtime-ws',
    dialect: 'stepfun',
    baseUrl: `wss://api.stepfun.com/v1/realtime/asr/stream?api_key=${SECRET}`,
    model: 'stepaudio-2.5-asr-stream',
    hasCredential: true,
    credentialRef: 'classolo.cred.asr',
  })
  if (profile.baseUrl.includes('?') || profile.baseUrl.includes(SECRET)) {
    throw new Error('provider base_url must strip query secrets')
  }
  const dump = JSON.stringify(await listProviderProfiles(db))
  if (dump.includes(SECRET) || dump.includes('apiKey') || dump.includes('api_key')) {
    throw new Error('provider profile leaked a secret')
  }

  let secretHeaderBlocked = false
  try {
    await insertProviderProfile(db, {
      kind: 'ai',
      label: 'bad',
      baseUrl: 'https://relay.protocom.org/v1',
      model: 'probe',
      options: { headers: { Authorization: `Bearer ${SECRET}` } },
    })
  } catch {
    secretHeaderBlocked = true
  }
  if (!secretHeaderBlocked) {
    throw new Error('Authorization header must be rejected')
  }

  await upsertSetting(db, 'asr.hotwords.presetPack', 'physics')
  const pack = await getSetting(db, 'asr.hotwords.presetPack')
  if (pack?.value !== 'physics') throw new Error('cs_setting upsert failed')

  await deleteSession(db, session.id)
  if ((await listTranscriptSegments(db, session.id)).length !== 0) {
    throw new Error('deleting a session must cascade transcript rows')
  }
  if ((await listChatMessages(db, session.id)).length !== 0) {
    throw new Error('deleting a session must cascade chat rows')
  }

  await db.$client.close()
  return `cs-tables:${first.length};anon=${ANONYMOUS_USER_ID.slice(-4)};cascade=ok`
}

const invokedDirectly = process.argv[1]?.replaceAll('\\', '/').endsWith(
  '/schema.probe.ts',
)
if (invokedDirectly) {
  void readCsTablesAndAnonymousUser().then((line) => {
    process.stdout.write(`${line}\n`)
  })
}
