import { eq, and, ne } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { zones, listings, priceSnapshots } from '../server/database/schema'

const IDEALISTA_TOKEN_URL = 'https://api.idealista.com/oauth/token'
const IDEALISTA_SEARCH_URL = 'https://api.idealista.com/3.5/es/search'

interface IdealistaProperty {
  propertyCode: string
  address: string
  latitude: number
  longitude: number
  propertyType: string
  rooms: number
  bathrooms: number
  size: number
  floor: string
  hasLift: boolean
  hasTerrace: boolean
  hasGardenOrTerrace: boolean
  parkingSpace?: { hasParkingSpace: boolean }
  price: number
  priceByArea: number
  agency?: string
  url: string
  thumbnail?: string
  description?: string
}

interface IdealistaResponse {
  elementList: IdealistaProperty[]
  total: number
  totalPages: number
}

async function getAccessToken(): Promise<string> {
  const apiKey = process.env.NUXT_IDEALISTA_API_KEY
  const apiSecret = process.env.NUXT_IDEALISTA_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error('Missing NUXT_IDEALISTA_API_KEY or NUXT_IDEALISTA_API_SECRET')
  }

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')

  const response = await fetch(IDEALISTA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=read',
  })

  if (!response.ok) {
    throw new Error(`OAuth failed: ${response.status} ${await response.text()}`)
  }

  const data = await response.json()
  return data.access_token
}

async function searchZone(
  token: string,
  lat: number,
  lng: number,
  radiusM: number,
): Promise<IdealistaProperty[]> {
  const allProperties: IdealistaProperty[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const params = new URLSearchParams({
      operation: 'sale',
      propertyType: 'homes',
      center: `${lat},${lng}`,
      distance: String(radiusM),
      maxItems: '50',
      numPage: String(page),
      order: 'date',
      sort: 'desc',
      language: 'es',
    })

    const response = await fetch(`${IDEALISTA_SEARCH_URL}?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Search failed (page ${page}): ${response.status} ${text}`)
    }

    const data: IdealistaResponse = await response.json()
    allProperties.push(...data.elementList)
    totalPages = data.totalPages
    page++

    // Small delay between pages to be respectful
    if (page <= totalPages) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return allProperties
}

export async function collectIdealista(db: LibSQLDatabase, today: string) {
  const token = await getAccessToken()
  const allZones = await db.select().from(zones)

  let totalNew = 0
  let totalUpdated = 0
  let totalDelisted = 0

  for (const zone of allZones) {
    console.log(`  📍 ${zone.name}...`)

    const properties = await searchZone(token, zone.lat, zone.lng, zone.radiusM)
    const foundIds = new Set<string>()

    for (const prop of properties) {
      const id = String(prop.propertyCode)
      foundIds.add(id)

      // Upsert listing
      const existing = await db.select().from(listings).where(eq(listings.id, id)).get()

      if (!existing) {
        await db.insert(listings).values({
          id,
          zoneId: zone.id,
          address: prop.address,
          lat: prop.latitude,
          lng: prop.longitude,
          propertyType: prop.propertyType,
          bedrooms: prop.rooms,
          bathrooms: prop.bathrooms,
          sizeM2: prop.size,
          floor: prop.floor,
          hasElevator: prop.hasLift,
          hasTerrace: prop.hasTerrace || prop.hasGardenOrTerrace,
          hasGarage: prop.parkingSpace?.hasParkingSpace ?? false,
          agency: prop.agency,
          idealistaUrl: prop.url,
          thumbnailUrl: prop.thumbnail,
          description: prop.description,
          firstSeen: today,
          lastSeen: today,
          status: 'active',
        })
        totalNew++
      } else {
        await db.update(listings)
          .set({ lastSeen: today, status: 'active' })
          .where(eq(listings.id, id))
        totalUpdated++
      }

      // Insert price snapshot
      await db.insert(priceSnapshots).values({
        listingId: id,
        date: today,
        price: prop.price,
        priceM2: prop.priceByArea,
      }).onConflictDoNothing()
    }

    // Mark listings not found today as delisted
    const activeListings = await db.select({ id: listings.id })
      .from(listings)
      .where(
        and(
          eq(listings.zoneId, zone.id),
          eq(listings.status, 'active'),
          ne(listings.lastSeen, today),
        ),
      )

    for (const listing of activeListings) {
      await db.update(listings)
        .set({ status: 'delisted' })
        .where(eq(listings.id, listing.id))
      totalDelisted++
    }

    console.log(`    → ${properties.length} listings found`)

    // Rate limit: wait between zones
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`  📊 Summary: ${totalNew} new, ${totalUpdated} updated, ${totalDelisted} delisted`)
}
