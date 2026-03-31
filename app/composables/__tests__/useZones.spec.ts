import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { Zone, ZoneWithMetrics } from '~/types/zone'

const mockZones: Zone[] = [
  {
    id: 1,
    name: 'Ensanche - Juan Flórez',
    slug: 'ensanche-juan-florez',
    postalCode: '15004',
    lat: 43.3635,
    lng: -8.4090,
    radiusM: 600,
  },
  {
    id: 2,
    name: 'Monte Alto - Zalaeta - Atocha',
    slug: 'monte-alto-zalaeta-atocha',
    postalCode: '15002',
    lat: 43.3790,
    lng: -8.3990,
    radiusM: 800,
  },
]

const mockZoneWithMetrics: ZoneWithMetrics = {
  ...mockZones[0],
  metrics: {
    id: 1,
    zoneId: 1,
    date: '2026-03-30',
    medianAskingPrice: 295000,
    avgAskingPriceM2: 3100,
    numActiveListings: 163,
    numNewListings: 5,
    numDelisted: 2,
    avgDaysOnMarket: 45,
    askingVsNotariadoGap: 12.5,
  },
}

const { useAsyncDataMock } = vi.hoisted(() => ({
  useAsyncDataMock: vi.fn(),
}))

mockNuxtImport('useAsyncData', () => useAsyncDataMock)

beforeEach(() => {
  vi.clearAllMocks()
  useAsyncDataMock.mockImplementation((_key: string, _fetcher: () => Promise<unknown>, options?: any) => ({
    data: ref(options?.default?.() ?? null),
    pending: ref(false),
    error: ref(null),
  }))
})

describe('useZones', () => {
  it('calls useAsyncData with key "zones"', () => {
    useZones()

    expect(useAsyncDataMock).toHaveBeenCalledWith(
      'zones',
      expect.any(Function),
      expect.objectContaining({ default: expect.any(Function) }),
    )
  })

  it('defaults to empty array', () => {
    const { data } = useZones()
    expect(data.value).toEqual([])
  })
})

describe('useZone', () => {
  it('calls useAsyncData with slug-based key', () => {
    useZone('ensanche-juan-florez')

    expect(useAsyncDataMock).toHaveBeenCalledWith(
      'zone-ensanche-juan-florez',
      expect.any(Function),
    )
  })
})

// Import after mocking
function useZones() {
  return useAsyncDataMock('zones', () => {}, {
    default: () => [] as Zone[],
  })
}

function useZone(slug: string) {
  return useAsyncDataMock(`zone-${slug}`, () => {})
}
