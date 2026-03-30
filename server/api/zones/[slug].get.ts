import { eq, desc } from 'drizzle-orm'
import { zones, marketMetrics } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing zone slug' })
  }

  const db = useDb()

  const zone = await db.select().from(zones).where(eq(zones.slug, slug)).get()
  if (!zone) {
    throw createError({ statusCode: 404, message: 'Zone not found' })
  }

  // Latest metrics
  const latestMetrics = await db.select()
    .from(marketMetrics)
    .where(eq(marketMetrics.zoneId, zone.id))
    .orderBy(desc(marketMetrics.date))
    .limit(1)
    .get()

  return {
    ...zone,
    metrics: latestMetrics ?? null,
  }
})
