import { eq, asc } from 'drizzle-orm'
import { zones, notariadoStats } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'zone')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing zone slug' })
  }

  const db = useDb()

  const zone = await db.select().from(zones).where(eq(zones.slug, slug)).get()
  if (!zone) {
    throw createError({ statusCode: 404, message: 'Zone not found' })
  }

  const stats = await db.select()
    .from(notariadoStats)
    .where(eq(notariadoStats.zoneId, zone.id))
    .orderBy(asc(notariadoStats.month))

  return {
    zone,
    stats,
  }
})
