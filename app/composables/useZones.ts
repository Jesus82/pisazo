import type { Zone, ZoneWithMetrics } from '~/types/zone'

export function useZones() {
  return useAsyncData('zones', () => $fetch<Zone[]>('/api/zones'), {
    default: () => [] as Zone[],
  })
}

export function useZone(slug: MaybeRef<string>) {
  return useAsyncData(`zone-${toValue(slug)}`, () =>
    $fetch<ZoneWithMetrics>(`/api/zones/${toValue(slug)}`),
  )
}
