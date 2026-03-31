import type { Zone } from '~/types/zone'
import type { MarketMetric } from '~/types/market'

interface MetricsResponse {
  zone: Zone
  metrics: MarketMetric[]
}

export function useMarketMetrics(zoneSlug: MaybeRef<string>) {
  return useAsyncData(`metrics-${toValue(zoneSlug)}`, () =>
    $fetch<MetricsResponse>(`/api/metrics/${toValue(zoneSlug)}`),
  )
}
