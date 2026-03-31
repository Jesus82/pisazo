// ─── DB row types (raw Drizzle select results) ───

export interface DbZone {
  id: number
  name: string
  slug: string
  postal_code: string | null
  lat: number
  lng: number
  radius_m: number
}

// ─── App types (what components receive) ───

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

// Forward declaration — full type lives in market.ts
import type { MarketMetric } from '~/types/market'
