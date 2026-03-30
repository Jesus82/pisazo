import { eq, asc } from 'drizzle-orm'
import { listings, priceSnapshots } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing listing id' })
  }

  const db = useDb()

  const listing = await db.select().from(listings).where(eq(listings.id, id)).get()
  if (!listing) {
    throw createError({ statusCode: 404, message: 'Listing not found' })
  }

  // Full price history
  const priceHistory = await db.select()
    .from(priceSnapshots)
    .where(eq(priceSnapshots.listingId, id))
    .orderBy(asc(priceSnapshots.date))

  return {
    ...listing,
    priceHistory,
  }
})
