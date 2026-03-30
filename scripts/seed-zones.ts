import 'dotenv/config'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'
import { zones } from '../server/database/schema'

// ─── Idealista's official 10 districts for A Coruña ───
// Names, slugs and groupings match idealista.com exactly.
// Coordinates are the approximate centroid of each district.
// Postal codes are the primary one (districts may span multiple).
// Radius is tuned to cover the district without excessive overlap.
//
// Source: https://www.idealista.com/venta-viviendas/a-coruna-a-coruna/
// Idealista URL pattern: /venta-viviendas/a-coruna/{slug}/

const CORUÑA_ZONES = [
  {
    name: 'Ensanche - Juan Flórez',
    slug: 'ensanche-juan-florez',
    postalCode: '15004',
    lat: 43.3660,
    lng: -8.4040,
    radiusM: 800,
  },
  {
    name: 'Monte Alto - Zalaeta - Atocha',
    slug: 'monte-alto-zalaeta-atocha',
    postalCode: '15002',
    lat: 43.3750,
    lng: -8.3890,
    radiusM: 900,
  },
  {
    name: 'Ciudad Vieja - Centro',
    slug: 'ciudad-vieja-centro',
    postalCode: '15001',
    lat: 43.3705,
    lng: -8.3960,
    radiusM: 600,
  },
  {
    name: 'Os Mallos',
    slug: 'os-mallos',
    postalCode: '15007',
    lat: 43.3570,
    lng: -8.4130,
    radiusM: 700,
  },
  {
    name: 'Agra del Orzán - Ventorrillo',
    slug: 'agra-del-orzan-ventorrillo',
    postalCode: '15010',
    lat: 43.3540,
    lng: -8.4190,
    radiusM: 800,
  },
  {
    name: 'Los Castros - Castrillón',
    slug: 'los-castros-castrillon',
    postalCode: '15009',
    lat: 43.3470,
    lng: -8.4040,
    radiusM: 800,
  },
  {
    name: 'Cuatro Caminos - Plaza de la Cubela',
    slug: 'cuatro-caminos-plaza-de-la-cubela',
    postalCode: '15005',
    lat: 43.3610,
    lng: -8.4100,
    radiusM: 700,
  },
  {
    name: 'Someso - Matogrande',
    slug: 'someso-matogrande',
    postalCode: '15009',
    lat: 43.3460,
    lng: -8.4150,
    radiusM: 900,
  },
  {
    name: 'Eirís',
    slug: 'eiris',
    postalCode: '15009',
    lat: 43.3500,
    lng: -8.3950,
    radiusM: 800,
  },
  {
    name: 'Elviña - A Zapateira',
    slug: 'elvina-a-zapateira',
    postalCode: '15008',
    lat: 43.3330,
    lng: -8.4140,
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
