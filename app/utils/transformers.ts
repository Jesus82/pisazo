import type { DbZone } from '~/types/zone'
import type { Zone } from '~/types/zone'
import type { DbListing } from '~/types/listing'
import type { Listing } from '~/types/listing'
import type { DbPriceSnapshot } from '~/types/price'
import type { PriceSnapshot } from '~/types/price'
import type { DbMarketMetric } from '~/types/market'
import type { MarketMetric } from '~/types/market'
import type { DbNotariadoStat } from '~/types/notariado'
import type { NotariadoStat } from '~/types/notariado'

export const transformZone = (db: DbZone): Zone => ({
  id: db.id,
  name: db.name,
  slug: db.slug,
  postalCode: db.postal_code,
  lat: db.lat,
  lng: db.lng,
  radiusM: db.radius_m,
})

export const transformListing = (
  db: DbListing,
  currentPrice: number | null = null,
  currentPriceM2: number | null = null,
): Listing => ({
  id: db.id,
  zoneId: db.zone_id,
  address: db.address,
  lat: db.lat,
  lng: db.lng,
  propertyType: db.property_type,
  bedrooms: db.bedrooms,
  bathrooms: db.bathrooms,
  sizeM2: db.size_m2,
  floor: db.floor,
  hasElevator: !!db.has_elevator,
  hasTerrace: !!db.has_terrace,
  hasGarage: !!db.has_garage,
  agency: db.agency,
  idealistaUrl: db.idealista_url,
  thumbnailUrl: db.thumbnail_url,
  description: db.description,
  firstSeen: db.first_seen,
  lastSeen: db.last_seen,
  status: db.status,
  currentPrice,
  currentPriceM2,
})

export const transformPriceSnapshot = (db: DbPriceSnapshot): PriceSnapshot => ({
  id: db.id,
  listingId: db.listing_id,
  date: db.date,
  price: db.price,
  priceM2: db.price_m2,
})

export const transformMarketMetric = (db: DbMarketMetric): MarketMetric => ({
  id: db.id,
  zoneId: db.zone_id,
  date: db.date,
  medianAskingPrice: db.median_asking_price,
  avgAskingPriceM2: db.avg_asking_price_m2,
  numActiveListings: db.num_active_listings,
  numNewListings: db.num_new_listings,
  numDelisted: db.num_delisted,
  avgDaysOnMarket: db.avg_days_on_market,
  askingVsNotariadoGap: db.asking_vs_notariado_gap,
})

export const transformNotariadoStat = (db: DbNotariadoStat): NotariadoStat => ({
  id: db.id,
  zoneId: db.zone_id,
  month: db.month,
  avgPriceM2: db.avg_price_m2,
  avgTotalPrice: db.avg_total_price,
  avgSurfaceM2: db.avg_surface_m2,
  numTransactions: db.num_transactions,
  pctForeignBuyers: db.pct_foreign_buyers,
})
