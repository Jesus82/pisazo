import type { PriceSnapshot } from '~/types/price'

// ─── DB row types (raw Drizzle select results) ───

export interface DbListing {
  id: string
  zone_id: number | null
  address: string | null
  lat: number | null
  lng: number | null
  property_type: string | null
  bedrooms: number | null
  bathrooms: number | null
  size_m2: number | null
  floor: string | null
  has_elevator: number | null
  has_terrace: number | null
  has_garage: number | null
  agency: string | null
  idealista_url: string | null
  thumbnail_url: string | null
  description: string | null
  first_seen: string
  last_seen: string
  status: string
}

// ─── App types (what components receive) ───

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
  hasElevator: boolean
  hasTerrace: boolean
  hasGarage: boolean
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
