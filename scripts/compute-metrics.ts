import { eq, and, sql, desc } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { zones, listings, priceSnapshots, notariadoStats, marketMetrics } from '../server/database/schema'

export async function computeMetrics(db: LibSQLDatabase, today: string) {
  const allZones = await db.select().from(zones)

  for (const zone of allZones) {
    // Active listings for this zone
    const activeListings = await db.select()
      .from(listings)
      .where(
        and(
          eq(listings.zoneId, zone.id),
          eq(listings.status, 'active'),
        ),
      )

    // Today's price snapshots for active listings
    const todayPrices = await db.select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.date, today))
      .innerJoin(listings, and(
        eq(priceSnapshots.listingId, listings.id),
        eq(listings.zoneId, zone.id),
      ))

    const prices = todayPrices
      .map(r => r.price_snapshots.price)
      .filter((p): p is number => p !== null)
      .sort((a, b) => a - b)

    const pricesM2 = todayPrices
      .map(r => r.price_snapshots.priceM2)
      .filter((p): p is number => p !== null)

    const medianPrice = prices.length > 0
      ? prices[Math.floor(prices.length / 2)]
      : null

    const avgPriceM2 = pricesM2.length > 0
      ? pricesM2.reduce((sum, p) => sum + p, 0) / pricesM2.length
      : null

    // New listings today
    const newToday = activeListings.filter(l => l.firstSeen === today).length

    // Delisted today
    const delistedToday = await db.select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(
        and(
          eq(listings.zoneId, zone.id),
          eq(listings.status, 'delisted'),
          eq(listings.lastSeen, today),
        ),
      )

    // Average days on market
    const daysOnMarket = activeListings.map((l) => {
      const first = new Date(l.firstSeen)
      const last = new Date(today)
      return Math.floor((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24))
    })
    const avgDays = daysOnMarket.length > 0
      ? daysOnMarket.reduce((sum, d) => sum + d, 0) / daysOnMarket.length
      : null

    // Compare with latest notariado data
    const latestNotariado = await db.select()
      .from(notariadoStats)
      .where(eq(notariadoStats.zoneId, zone.id))
      .orderBy(desc(notariadoStats.month))
      .limit(1)
      .get()

    let gap: number | null = null
    if (avgPriceM2 && latestNotariado?.avgPriceM2) {
      gap = ((avgPriceM2 - latestNotariado.avgPriceM2) / latestNotariado.avgPriceM2) * 100
    }

    // Upsert market metrics
    await db.insert(marketMetrics).values({
      zoneId: zone.id,
      date: today,
      medianAskingPrice: medianPrice,
      avgAskingPriceM2: avgPriceM2 ? Math.round(avgPriceM2 * 100) / 100 : null,
      numActiveListings: activeListings.length,
      numNewListings: newToday,
      numDelisted: delistedToday[0]?.count ?? 0,
      avgDaysOnMarket: avgDays ? Math.round(avgDays * 10) / 10 : null,
      askingVsNotariadoGap: gap ? Math.round(gap * 100) / 100 : null,
    }).onConflictDoNothing()

    console.log(`  📍 ${zone.name}: ${activeListings.length} active, median €${medianPrice?.toLocaleString() ?? 'N/A'}`)
  }
}
