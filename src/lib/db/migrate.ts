import type { PGlite } from '@electric-sql/pglite'

import { ANONYMOUS_USER_ID, ANONYMOUS_USER_SETTING_KEY } from './constants'
import { INIT_SQL } from './sql/init'

async function tableExists(client: PGlite, name: string): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `select to_regclass($1) is not null as exists`,
    [`public.${name}`],
  )
  return result.rows[0]?.exists === true
}

async function seedAnonymousUser(client: PGlite): Promise<void> {
  await client.query(
    `insert into cs_setting (key, user_id, value, updated_at)
     values ($1, $2, to_jsonb($3::text), now())
     on conflict (key) do update
       set value = excluded.value,
           user_id = excluded.user_id,
           updated_at = excluded.updated_at`,
    [ANONYMOUS_USER_SETTING_KEY, ANONYMOUS_USER_ID, ANONYMOUS_USER_ID],
  )
}

/** Idempotent: second call is a no-op once `cs_session` exists. */
export async function applyInitMigration(client: PGlite): Promise<void> {
  await client.waitReady
  if (await tableExists(client, 'cs_user')) {
    throw new Error('cs_user must not exist (P0 has no account table)')
  }
  if (!(await tableExists(client, 'cs_session'))) {
    await client.exec(INIT_SQL)
  }
  if (await tableExists(client, 'cs_user')) {
    throw new Error('init SQL must not create cs_user')
  }
  await seedAnonymousUser(client)
}
