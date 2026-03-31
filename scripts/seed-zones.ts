import 'dotenv/config'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'
import { zones } from '../server/database/schema'

// ─── All Idealista districts for A Coruña ───
// Names, slugs and groupings match idealista.com exactly.
// Coordinates are the approximate centroid of each merged polygon.
// Postal codes are the primary one (districts may span multiple).
//
// Source: https://www.idealista.com/venta-viviendas/a-coruna-a-coruna/mapa
// Boundaries: ide.coruna.gal → 109 barrios merged to match Idealista zones

const CORUÑA_ZONES = [
  {
    name: 'Ensanche - Juan Flórez',
    slug: 'ensanche-juan-florez',
    postalCode: '15004',
    lat: 43.3635,
    lng: -8.4090,
    radiusM: 600,
  },
  {
    name: 'Monte Alto - Zalaeta - Atocha',
    slug: 'monte-alto-zalaeta-atocha',
    postalCode: '15002',
    lat: 43.3790,
    lng: -8.3990,
    radiusM: 800,
  },
  {
    name: 'Ciudad Vieja - Centro',
    slug: 'ciudad-vieja-centro',
    postalCode: '15001',
    lat: 43.3670,
    lng: -8.3960,
    radiusM: 500,
  },
  {
    name: 'Os Mallos',
    slug: 'os-mallos',
    postalCode: '15007',
    lat: 43.3535,
    lng: -8.4105,
    radiusM: 500,
  },
  {
    name: 'Agra del Orzán - Ventorrillo',
    slug: 'agra-del-orzan-ventorrillo',
    postalCode: '15010',
    lat: 43.3580,
    lng: -8.4250,
    radiusM: 700,
  },
  {
    name: 'Los Castros - Castrillón',
    slug: 'los-castros-castrillon',
    postalCode: '15009',
    lat: 43.3490,
    lng: -8.3940,
    radiusM: 600,
  },
  {
    name: 'Cuatro Caminos - Plaza de la Cubela',
    slug: 'cuatro-caminos-plaza-de-la-cubela',
    postalCode: '15005',
    lat: 43.3545,
    lng: -8.4000,
    radiusM: 500,
  },
  {
    name: 'Someso - Matogrande',
    slug: 'someso-matogrande',
    postalCode: '15009',
    lat: 43.3430,
    lng: -8.4100,
    radiusM: 800,
  },
  {
    name: 'Eirís',
    slug: 'eiris',
    postalCode: '15009',
    lat: 43.3380,
    lng: -8.3920,
    radiusM: 700,
  },
  {
    name: 'Elviña - A Zapateira',
    slug: 'elvina-a-zapateira',
    postalCode: '15008',
    lat: 43.3300,
    lng: -8.4080,
    radiusM: 800,
  },
  {
    name: 'Riazor - Visma',
    slug: 'riazor-visma',
    postalCode: '15006',
    lat: 43.3690,
    lng: -8.4190,
    radiusM: 600,
  },
  {
    name: 'Los Rosales',
    slug: 'los-rosales',
    postalCode: '15011',
    lat: 43.3690,
    lng: -8.4400,
    radiusM: 1000,
  },
  {
    name: 'Sagrada Familia',
    slug: 'sagrada-familia',
    postalCode: '15006',
    lat: 43.3585,
    lng: -8.4150,
    radiusM: 500,
  },
  {
    name: 'Mesoiro',
    slug: 'mesoiro',
    postalCode: '15190',
    lat: 43.3280,
    lng: -8.4300,
    radiusM: 1200,
  },
]

async function main() {
  const client = createClient({
    url: process.env.NUXT_TURSO_DB_URL!,
    authToken: process.env.NUXT_TURSO_AUTH_TOKEN,
  })

  const db = drizzle(client)

  // Clear existing zones and re-seed
  console.log('Clearing existing zones...')
  await db.delete(zones)

  // Reset autoincrement
  await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'zones'`)

  console.log('Seeding zones for A Coruña (matching Idealista districts)...\n')

  for (const zone of CORUÑA_ZONES) {
    await db.insert(zones).values(zone)
    console.log(`  ✓ ${zone.name} (CP ${zone.postalCode})`)
  }

  console.log(`\nDone! Seeded ${CORUÑA_ZONES.length} zones.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Failed to seed zones:', err)
  process.exit(1)
})
