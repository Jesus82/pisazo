import type { Zone } from '~/types/zone'
import type { NotariadoStat } from '~/types/notariado'

interface NotariadoResponse {
  zone: Zone
  stats: NotariadoStat[]
}

export function useNotariado(zoneSlug: MaybeRef<string>) {
  return useAsyncData(`notariado-${toValue(zoneSlug)}`, () =>
    $fetch<NotariadoResponse>(`/api/notariado/${toValue(zoneSlug)}`),
  )
}
