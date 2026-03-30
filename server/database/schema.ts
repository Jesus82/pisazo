import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core'

// ─── Zones ───
// Areas of A Coruña we're tracking
export const zones = sqliteTable('zones', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  postalCode: text('postal_code'),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  radiusM: integer('radius_m').notNull().default(1000),
})

// ─── Listings ───
// Individual Idealista property listings
export const listings = sqliteTable('listings', {
  id: text('id').primaryKey(), // Idealista property code
  zoneId: integer('zone_id').references(() => zones.id),
  address: text('address'),
  lat: real('lat'),
  lng: real('lng'),
  propertyType: text('property_type'), // flat, house, penthouse, studio, duplex
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  sizeM2: real('size_m2'),
  floor: text('floor'),
  hasElevator: integer('has_elevator', { mode: 'boolean' }),
  hasTerrace: integer('has_terrace', { mode: 'boolean' }),
  hasGarage: integer('has_garage', { mode: 'boolean' }),
  agency: text('agency'),
  idealistaUrl: text('idealista_url'),
  thumbnailUrl: text('thumbnail_url'),
  description: text('description'),
  firstSeen: text('first_seen').notNull(), // ISO date
  lastSeen: text('last_seen').notNull(), // ISO date
  status: text('status').notNull().default('active'), // active, delisted, sold_inferred
})

// ─── Price Snapshots ───
// Daily price recordings for each listing
export const priceSnapshots = sqliteTable('price_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  listingId: text('listing_id').notNull().references(() => listings.id),
  date: text('date').notNull(), // ISO date YYYY-MM-DD
  price: integer('price'), // asking price in EUR
  priceM2: real('price_m2'), // price per sqm
}, (table) => [
  uniqueIndex('price_snapshots_listing_date_idx').on(table.listingId, table.date),
])

// ─── Notariado Stats ───
// Monthly aggregate data from Portal del Notariado (real transaction prices)
export const notariadoStats = sqliteTable('notariado_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  zoneId: integer('zone_id').notNull().references(() => zones.id),
  month: text('month').notNull(), // YYYY-MM
  avgPriceM2: real('avg_price_m2'),
  avgTotalPrice: real('avg_total_price'),
  avgSurfaceM2: real('avg_surface_m2'),
  numTransactions: integer('num_transactions'),
  pctForeignBuyers: real('pct_foreign_buyers'),
}, (table) => [
  uniqueIndex('notariado_stats_zone_month_idx').on(table.zoneId, table.month),
])

// ─── Market Metrics ───
// Daily derived/aggregated metrics per zone
export const marketMetrics = sqliteTable('market_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  zoneId: integer('zone_id').notNull().references(() => zones.id),
  date: text('date').notNull(), // ISO date YYYY-MM-DD
  medianAskingPrice: integer('median_asking_price'),
  avgAskingPriceM2: real('avg_asking_price_m2'),
  numActiveListings: integer('num_active_listings'),
  numNewListings: integer('num_new_listings'),
  numDelisted: integer('num_delisted'),
  avgDaysOnMarket: real('avg_days_on_market'),
  askingVsNotariadoGap: real('asking_vs_notariado_gap'), // % difference
}, (table) => [
  uniqueIndex('market_metrics_zone_date_idx').on(table.zoneId, table.date),
])
