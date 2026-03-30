import 'dotenv/config'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { collectIdealista } from './collect-idealista'
import { computeMetrics } from './compute-metrics'

async function main() {
  const client = createClient({
    url: process.env.NUXT_TURSO_DB_URL!,
    authToken: process.env.NUXT_TURSO_AUTH_TOKEN,
  })

  const db = drizzle(client)
  const today = new Date().toISOString().split('T')[0]

  console.log(`\n📊 Pisazo data collection — ${today}`)
  console.log('─'.repeat(50))

  // Step 1: Collect Idealista listings
  console.log('\n🏠 Step 1: Collecting Idealista listings...')
  await collectIdealista(db, today)

  // Step 2: Compute daily market metrics
  console.log('\n📈 Step 2: Computing market metrics...')
  await computeMetrics(db, today)

  // Step 3: Notariado data (monthly — check if new data available)
  // TODO: Implement in Phase 2
  console.log('\n📋 Step 3: Notariado data — skipped (monthly check, not yet implemented)')

  console.log('\n✅ Collection complete!\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Collection failed:', err)
  process.exit(1)
})
