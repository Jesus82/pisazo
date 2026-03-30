import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../database/schema'

let _db: ReturnType<typeof drizzle> | null = null

export function useDb() {
  if (_db) return _db

  const config = useRuntimeConfig()
  const client = createClient({
    url: config.tursoDbUrl,
    authToken: config.tursoAuthToken,
  })

  _db = drizzle(client, { schema })
  return _db
}
