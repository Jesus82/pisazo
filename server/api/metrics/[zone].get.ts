import { eq, asc } from 'drizzle-orm'
import { zones, marketMetrics } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'zone')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing zone slug' })
  }

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 90, 365)

  const db = useDb()

  const zone = await db.select().from(zones).where(eq(zones.slug, slug)).get()
  if (!zone) {
    throw createError({ statusCode: 404, message: 'Zone not found' })
  }

  const metrics = await db.select()
    .from(marketMetrics)
    .where(eq(marketMetrics.zoneId, zone.id))
    .orderBy(asc(marketMetrics.date))
    .limit(limit)

  return {
    zone,
    metrics,
  }
})
