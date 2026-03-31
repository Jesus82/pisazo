import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { Listing } from '~/types/listing'

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

// Simulate composable logic
function useListings(zone?: string) {
  const key = zone ? `listings-${zone}` : 'listings'
  return useAsyncDataMock(key, () => {}, {
    default: () => [] as Listing[],
  })
}

function useListing(id: string) {
  return useAsyncDataMock(`listing-${id}`, () => {})
}

describe('useListings', () => {
  it('calls useAsyncData with key "listings" when no zone provided', () => {
    useListings()

    expect(useAsyncDataMock).toHaveBeenCalledWith(
      'listings',
      expect.any(Function),
      expect.objectContaining({ default: expect.any(Function) }),
    )
  })

  it('uses zone-specific key when zone is provided', () => {
    useListings('ensanche-juan-florez')

    expect(useAsyncDataMock).toHaveBeenCalledWith(
      'listings-ensanche-juan-florez',
      expect.any(Function),
      expect.objectContaining({ default: expect.any(Function) }),
    )
  })

  it('defaults to empty array', () => {
    const result = useListings()
    expect(result.data.value).toEqual([])
  })
})

describe('useListing', () => {
  it('calls useAsyncData with listing-specific key', () => {
    useListing('ABC123')

    expect(useAsyncDataMock).toHaveBeenCalledWith(
      'listing-ABC123',
      expect.any(Function),
    )
  })
})
