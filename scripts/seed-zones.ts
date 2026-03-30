import 'dotenv/config'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { zones } from '../server/database/schema'

const CORUÑA_ZONES = [
  {
    name: 'Centro',
    slug: 'centro',
    postalCode: '15001',
    lat: 43.3713,
    lng: -8.3963,
    radiusM: 800,
  },
  {
    name: 'Monte Alto',
    slug: 'monte-alto',
    postalCode: '15002',
    lat: 43.3740,
    lng: -8.3880,
    radiusM: 700,
  },
  {
    name: 'Eirís',
    slug: 'eiris',
    postalCode: '15009',
    lat: 43.3550,
    lng: -8.4080,
    radiusM: 800,
  },
  {
    name: 'Os Mallos',
    slug: 'os-mallos',
    postalCode: '15007',
    lat: 43.3590,
    lng: -8.4170,
    radiusM: 700,
  },
  {
    name: 'Riazor',
    slug: 'riazor',
    postalCode: '15006',
    lat: 43.3630,
    lng: -8.4110,
    radiusM: 600,
  },
  {
    name: 'Cuatro Caminos',
    slug: 'cuatro-caminos',
    postalCode: '15008',
    lat: 43.3520,
    lng: -8.4190,
    radiusM: 800,
  },
  {
    name: 'Elviña',
    slug: 'elvina',
    postalCode: '15008',
    lat: 43.3340,
    lng: -8.4130,
    radiusM: 1000,
  },
  {
    name: 'Os Castros',
    slug: 'os-castros',
    postalCode: '15002',
    lat: 43.3770,
    lng: -8.4020,
    radiusM: 700,
  },
  {
    name: 'Agra do Orzán',
    slug: 'agra-do-orzan',
    postalCode: '15006',
    lat: 43.3605,
    lng: -8.4060,
    radiusM: 600,
  },
  {
    name: 'Los Rosales',
    slug: 'los-rosales',
    postalCode: '15008',
    lat: 43.3430,
    lng: -8.4210,
    radiusM: 800,
  },
  {
    name: 'Matogrande',
    slug: 'matogrande',
    postalCode: '15009',
    lat: 43.3450,
    lng: -8.4050,
    radiusM: 700,
  },
  {
    name: 'Ciudad Vieja (Pescadería)',
    slug: 'ciudad-vieja',
    postalCode: '15001',
    lat: 43.3700,
    lng: -8.3930,
    radiusM: 500,
  },
]

async function main() {
  const client = createClient({
    url: process.env.NUXT_TURSO_DB_URL!,
    authToken: process.env.NUXT_TURSO_AUTH_TOKEN,
  })

  const db = drizzle(client)

  console.log('Seeding zones for A Coruña...')

  for (const zone of CORUÑA_ZONES) {
    await db.insert(zones).values(zone).onConflictDoNothing()
    console.log(`  ✓ ${zone.name} (${zone.postalCode})`)
  }

  console.log(`\nDone! Seeded ${CORUÑA_ZONES.length} zones.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Failed to seed zones:', err)
  process.exit(1)
})
