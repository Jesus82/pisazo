import type { Zone, MarketMetric } from '~/types'

interface MetricsResponse {
  zone: Zone
  metrics: MarketMetric[]
}

export function useMarketMetrics(zoneSlug: MaybeRef<string>) {
  return useAsyncData(`metrics-${toValue(zoneSlug)}`, () =>
    $fetch<MetricsResponse>(`/api/metrics/${toValue(zoneSlug)}`),
  )
}
