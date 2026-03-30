export interface Zone {
  id: number
  name: string
  slug: string
  postalCode: string | null
  lat: number
  lng: number
  radiusM: number
}

export interface ZoneWithMetrics extends Zone {
  metrics: MarketMetric | null
}

export interface Listing {
  id: string
  zoneId: number | null
  address: string | null
  lat: number | null
  lng: number | null
  propertyType: string | null
  bedrooms: number | null
  bathrooms: number | null
  sizeM2: number | null
  floor: string | null
  hasElevator: boolean | null
  hasTerrace: boolean | null
  hasGarage: boolean | null
  agency: string | null
  idealistaUrl: string | null
  thumbnailUrl: string | null
  description: string | null
  firstSeen: string
  lastSeen: string
  status: string
  currentPrice: number | null
  currentPriceM2: number | null
}

export interface ListingWithHistory extends Omit<Listing, 'currentPrice' | 'currentPriceM2'> {
  priceHistory: PriceSnapshot[]
}

export interface PriceSnapshot {
  id: number
  listingId: string
  date: string
  price: number | null
  priceM2: number | null
}

export interface MarketMetric {
  id: number
  zoneId: number
  date: string
  medianAskingPrice: number | null
  avgAskingPriceM2: number | null
  numActiveListings: number | null
  numNewListings: number | null
  numDelisted: number | null
  avgDaysOnMarket: number | null
  askingVsNotariadoGap: number | null
}

export interface NotariadoStat {
  id: number
  zoneId: number
  month: string
  avgPriceM2: number | null
  avgTotalPrice: number | null
  avgSurfaceM2: number | null
  numTransactions: number | null
  pctForeignBuyers: number | null
}
