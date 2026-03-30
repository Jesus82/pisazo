import { eq, and, desc } from 'drizzle-orm'
import { listings, priceSnapshots, zones } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const zoneSlug = query.zone as string | undefined
  const status = (query.status as string) || 'active'
  const limit = Math.min(Number(query.limit) || 50, 200)
  const offset = Number(query.offset) || 0

  const db = useDb()

  // Build conditions
  const conditions = [eq(listings.status, status)]

  if (zoneSlug) {
    const zone = await db.select().from(zones).where(eq(zones.slug, zoneSlug)).get()
    if (zone) {
      conditions.push(eq(listings.zoneId, zone.id))
    }
  }

  const results = await db.select()
    .from(listings)
    .where(and(...conditions))
    .orderBy(desc(listings.lastSeen))
    .limit(limit)
    .offset(offset)

  // Attach latest price to each listing
  const withPrices = await Promise.all(
    results.map(async (listing) => {
      const latestPrice = await db.select()
        .from(priceSnapshots)
        .where(eq(priceSnapshots.listingId, listing.id))
        .orderBy(desc(priceSnapshots.date))
        .limit(1)
        .get()

      return {
        ...listing,
        currentPrice: latestPrice?.price ?? null,
        currentPriceM2: latestPrice?.priceM2 ?? null,
      }
    }),
  )

  return withPrices
})
