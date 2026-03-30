import type { Zone, NotariadoStat } from '~/types'

interface NotariadoResponse {
  zone: Zone
  stats: NotariadoStat[]
}

export function useNotariado(zoneSlug: MaybeRef<string>) {
  return useAsyncData(`notariado-${toValue(zoneSlug)}`, () =>
    $fetch<NotariadoResponse>(`/api/notariado/${toValue(zoneSlug)}`),
  )
}
