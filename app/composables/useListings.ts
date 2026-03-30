import type { Listing, ListingWithHistory } from '~/types'

export function useListings(zone?: MaybeRef<string>) {
  const zoneVal = zone ? toValue(zone) : undefined
  const key = zoneVal ? `listings-${zoneVal}` : 'listings'
  const query = zoneVal ? { zone: zoneVal } : {}

  return useAsyncData(key, () => $fetch<Listing[]>('/api/listings', { query }), {
    default: () => [],
  })
}

export function useListing(id: MaybeRef<string>) {
  return useAsyncData(`listing-${toValue(id)}`, () =>
    $fetch<ListingWithHistory>(`/api/listings/${toValue(id)}`),
  )
}
