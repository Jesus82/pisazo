import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './server/database/migrations',
  schema: './server/database/schema.ts',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.NUXT_TURSO_DB_URL!,
    authToken: process.env.NUXT_TURSO_AUTH_TOKEN,
  },
})
