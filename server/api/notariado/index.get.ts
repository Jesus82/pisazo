import { eq, desc } from 'drizzle-orm'
import { zones, notariadoStats } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = useDb()

  const allZones = await db.select().from(zones)

  const result = await Promise.all(
    allZones.map(async (zone) => {
      const latestStat = await db.select()
        .from(notariadoStats)
        .where(eq(notariadoStats.zoneId, zone.id))
        .orderBy(desc(notariadoStats.month))
        .limit(1)
        .get()

      return {
        zone,
        stat: latestStat ?? null,
      }
    }),
  )

  return result
})
