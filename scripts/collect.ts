import 'dotenv/config'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { collectIdealista } from './collect-idealista'
import { collectNotariado } from './collect-notariado'
import { collectIne } from './collect-ine'
import { collectRegistradores } from './collect-registradores'
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

  // Step 1: Collect Idealista listings (requires API keys)
  if (process.env.NUXT_IDEALISTA_API_KEY && process.env.NUXT_IDEALISTA_API_SECRET) {
    console.log('\n🏠 Step 1: Collecting Idealista listings...')
    await collectIdealista(db, today)
  } else {
    console.log('\n🏠 Step 1: Skipped — Idealista API keys not configured')
  }

  // Step 2: Compute daily market metrics
  console.log('\n📈 Step 2: Computing market metrics...')
  await computeMetrics(db, today)

  // Step 3: Notariado data (public ArcGIS FeatureServer, no auth needed)
  console.log('\n📋 Step 3: Collecting Notariado data...')
  await collectNotariado(db, today)

  // Step 4: INE IPVA district-level price index (public JSON API)
  console.log('\n📊 Step 4: Collecting INE IPVA district data...')
  await collectIne(db, today)

  // Step 5: Registradores transaction data (via INE proxy)
  console.log('\n🏛️ Step 5: Collecting Registradores transaction data...')
  await collectRegistradores(db, today)

  console.log('\n✅ Collection complete!\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Collection failed:', err)
  process.exit(1)
})
