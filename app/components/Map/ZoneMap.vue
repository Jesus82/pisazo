<script setup lang="ts">
import type { Zone } from '~/types'

const props = defineProps<{
  zones: Zone[]
  notariadoData?: Map<number, number> // zoneId -> precio_m2
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const mapInstance = ref<any>(null)

onMounted(async () => {
  if (!mapContainer.value) return

  const L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  const map = L.map(mapContainer.value).setView([43.3623, -8.4115], 13)
  mapInstance.value = map

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  }).addTo(map)

  // Add zone circles
  for (const zone of props.zones) {
    const priceM2 = props.notariadoData?.get(zone.id)
    const color = priceM2 ? getColor(priceM2) : '#3579a8'

    const circle = L.circle([zone.lat, zone.lng], {
      radius: zone.radiusM,
      color,
      fillColor: color,
      fillOpacity: 0.2,
      weight: 2,
    }).addTo(map)

    const tooltip = priceM2
      ? `<strong>${zone.name}</strong><br/>${priceM2.toLocaleString('es-ES')} €/m²`
      : `<strong>${zone.name}</strong>`

    circle.bindTooltip(tooltip, { permanent: false })
    circle.on('click', () => {
      navigateTo(`/zones/${zone.slug}`)
    })
  }
})

function getColor(priceM2: number): string {
  if (priceM2 > 3000) return '#c0392b'
  if (priceM2 > 2500) return '#e67e22'
  if (priceM2 > 2000) return '#f1c40f'
  return '#27ae60'
}

onUnmounted(() => {
  mapInstance.value?.remove()
})
</script>

<template>
  <div ref="mapContainer" class="zone-map" />
</template>

<style scoped>
.zone-map {
  height: 400px;
  width: 100%;
  border-radius: var(--border-radius-lg);
  z-index: 0;
}
</style>
