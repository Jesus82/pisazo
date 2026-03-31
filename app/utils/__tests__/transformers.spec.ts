import { describe, it, expect } from 'vitest'
import {
  transformZone,
  transformListing,
  transformPriceSnapshot,
  transformMarketMetric,
  transformNotariadoStat,
} from '../transformers'
import type { DbZone } from '~/types/zone'
import type { DbListing } from '~/types/listing'
import type { DbPriceSnapshot } from '~/types/price'
import type { DbMarketMetric } from '~/types/market'
import type { DbNotariadoStat } from '~/types/notariado'

// ─── Mock data ───

const mockDbZone: DbZone = {
  id: 1,
  name: 'Ensanche - Juan Flórez',
  slug: 'ensanche-juan-florez',
  postal_code: '15004',
  lat: 43.3635,
  lng: -8.4090,
  radius_m: 600,
}

const mockDbListing: DbListing = {
  id: 'ABC123',
  zone_id: 1,
  address: 'Calle Real 42',
  lat: 43.3700,
  lng: -8.3960,
  property_type: 'flat',
  bedrooms: 3,
  bathrooms: 2,
  size_m2: 95.5,
  floor: '4',
  has_elevator: 1,
  has_terrace: 0,
  has_garage: 1,
  agency: 'Inmobiliaria Coruña',
  idealista_url: 'https://www.idealista.com/inmueble/ABC123/',
  thumbnail_url: 'https://img.idealista.com/abc.jpg',
  description: 'Piso luminoso en el Ensanche',
  first_seen: '2026-03-01',
  last_seen: '2026-03-30',
  status: 'active',
}

const mockDbPriceSnapshot: DbPriceSnapshot = {
  id: 42,
  listing_id: 'ABC123',
  date: '2026-03-30',
  price: 285000,
  price_m2: 2984.29,
}

const mockDbMarketMetric: DbMarketMetric = {
  id: 7,
  zone_id: 1,
  date: '2026-03-30',
  median_asking_price: 295000,
  avg_asking_price_m2: 3100.50,
  num_active_listings: 163,
  num_new_listings: 5,
  num_delisted: 2,
  avg_days_on_market: 45.3,
  asking_vs_notariado_gap: 12.5,
}

const mockDbNotariadoStat: DbNotariadoStat = {
  id: 3,
  zone_id: 1,
  month: '2026-01',
  avg_price_m2: 3307,
  avg_total_price: 245000,
  avg_surface_m2: 85.2,
  num_transactions: 137,
  pct_foreign_buyers: 4.5,
}

// ─── Tests ───

describe('transformZone', () => {
  it('maps snake_case DB fields to camelCase app fields', () => {
    const result = transformZone(mockDbZone)

    expect(result.id).toBe(1)
    expect(result.name).toBe('Ensanche - Juan Flórez')
    expect(result.slug).toBe('ensanche-juan-florez')
    expect(result.postalCode).toBe('15004')
    expect(result.lat).toBe(43.3635)
    expect(result.lng).toBe(-8.4090)
    expect(result.radiusM).toBe(600)
  })

  it('handles null postal code', () => {
    const result = transformZone({ ...mockDbZone, postal_code: null })
    expect(result.postalCode).toBeNull()
  })
})

describe('transformListing', () => {
  it('maps all fields correctly', () => {
    const result = transformListing(mockDbListing, 285000, 2984.29)

    expect(result.id).toBe('ABC123')
    expect(result.zoneId).toBe(1)
    expect(result.address).toBe('Calle Real 42')
    expect(result.propertyType).toBe('flat')
    expect(result.bedrooms).toBe(3)
    expect(result.bathrooms).toBe(2)
    expect(result.sizeM2).toBe(95.5)
    expect(result.floor).toBe('4')
    expect(result.agency).toBe('Inmobiliaria Coruña')
    expect(result.idealistaUrl).toBe('https://www.idealista.com/inmueble/ABC123/')
    expect(result.thumbnailUrl).toBe('https://img.idealista.com/abc.jpg')
    expect(result.firstSeen).toBe('2026-03-01')
    expect(result.lastSeen).toBe('2026-03-30')
    expect(result.status).toBe('active')
    expect(result.currentPrice).toBe(285000)
    expect(result.currentPriceM2).toBe(2984.29)
  })

  it('coerces integer booleans to actual booleans', () => {
    const result = transformListing(mockDbListing)

    expect(result.hasElevator).toBe(true)
    expect(result.hasTerrace).toBe(false)
    expect(result.hasGarage).toBe(true)
  })

  it('handles null boolean fields', () => {
    const result = transformListing({
      ...mockDbListing,
      has_elevator: null,
      has_terrace: null,
      has_garage: null,
    })

    expect(result.hasElevator).toBe(false)
    expect(result.hasTerrace).toBe(false)
    expect(result.hasGarage).toBe(false)
  })

  it('defaults currentPrice and currentPriceM2 to null', () => {
    const result = transformListing(mockDbListing)

    expect(result.currentPrice).toBeNull()
    expect(result.currentPriceM2).toBeNull()
  })
})

describe('transformPriceSnapshot', () => {
  it('maps all fields correctly', () => {
    const result = transformPriceSnapshot(mockDbPriceSnapshot)

    expect(result.id).toBe(42)
    expect(result.listingId).toBe('ABC123')
    expect(result.date).toBe('2026-03-30')
    expect(result.price).toBe(285000)
    expect(result.priceM2).toBe(2984.29)
  })

  it('handles null price fields', () => {
    const result = transformPriceSnapshot({
      ...mockDbPriceSnapshot,
      price: null,
      price_m2: null,
    })

    expect(result.price).toBeNull()
    expect(result.priceM2).toBeNull()
  })
})

describe('transformMarketMetric', () => {
  it('maps all fields correctly', () => {
    const result = transformMarketMetric(mockDbMarketMetric)

    expect(result.id).toBe(7)
    expect(result.zoneId).toBe(1)
    expect(result.date).toBe('2026-03-30')
    expect(result.medianAskingPrice).toBe(295000)
    expect(result.avgAskingPriceM2).toBe(3100.50)
    expect(result.numActiveListings).toBe(163)
    expect(result.numNewListings).toBe(5)
    expect(result.numDelisted).toBe(2)
    expect(result.avgDaysOnMarket).toBe(45.3)
    expect(result.askingVsNotariadoGap).toBe(12.5)
  })

  it('handles all-null metric fields', () => {
    const result = transformMarketMetric({
      ...mockDbMarketMetric,
      median_asking_price: null,
      avg_asking_price_m2: null,
      num_active_listings: null,
      num_new_listings: null,
      num_delisted: null,
      avg_days_on_market: null,
      asking_vs_notariado_gap: null,
    })

    expect(result.medianAskingPrice).toBeNull()
    expect(result.avgAskingPriceM2).toBeNull()
    expect(result.numActiveListings).toBeNull()
    expect(result.numNewListings).toBeNull()
    expect(result.numDelisted).toBeNull()
    expect(result.avgDaysOnMarket).toBeNull()
    expect(result.askingVsNotariadoGap).toBeNull()
  })
})

describe('transformNotariadoStat', () => {
  it('maps all fields correctly', () => {
    const result = transformNotariadoStat(mockDbNotariadoStat)

    expect(result.id).toBe(3)
    expect(result.zoneId).toBe(1)
    expect(result.month).toBe('2026-01')
    expect(result.avgPriceM2).toBe(3307)
    expect(result.avgTotalPrice).toBe(245000)
    expect(result.avgSurfaceM2).toBe(85.2)
    expect(result.numTransactions).toBe(137)
    expect(result.pctForeignBuyers).toBe(4.5)
  })

  it('handles null fields', () => {
    const result = transformNotariadoStat({
      ...mockDbNotariadoStat,
      avg_price_m2: null,
      avg_total_price: null,
      avg_surface_m2: null,
      num_transactions: null,
      pct_foreign_buyers: null,
    })

    expect(result.avgPriceM2).toBeNull()
    expect(result.avgTotalPrice).toBeNull()
    expect(result.avgSurfaceM2).toBeNull()
    expect(result.numTransactions).toBeNull()
    expect(result.pctForeignBuyers).toBeNull()
  })
})
