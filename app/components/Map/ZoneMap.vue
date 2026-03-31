<script setup lang="ts">
import type { Zone } from '~/types/zone'

const props = defineProps<{
  zones: Zone[]
  notariadoData?: Map<number, number> // zoneId -> precio_m2
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const mapInstance = ref<any>(null)

// Build a slug->zone lookup for matching GeoJSON features to zones
const zoneBySlug = computed(() => {
  const map = new Map<string, Zone>()
  for (const z of props.zones) {
    map.set(z.slug, z)
  }
  return map
})

onMounted(async () => {
  if (!mapContainer.value) return

  const L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  const map = L.map(mapContainer.value, {
    scrollWheelZoom: false,
  }).setView([43.3570, -8.4060], 13)

  mapInstance.value = map

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  }).addTo(map)

  // Load district boundaries GeoJSON
  try {
    const response = await fetch('/districts.geojson')
    const geojson = await response.json()

    L.geoJSON(geojson, {
      style: (feature: any) => {
        const slug = feature?.properties?.slug
        const zone = slug ? zoneBySlug.value.get(slug) : null
        const priceM2 = zone ? props.notariadoData?.get(zone.id) : null
        const color = priceM2 ? getColor(priceM2) : '#3579a8'

        return {
          color,
          weight: 2,
          opacity: 0.8,
          fillColor: color,
          fillOpacity: 0.2,
          dashArray: '',
        }
      },
      onEachFeature: (feature: any, layer: any) => {
        const slug = feature?.properties?.slug
        const name = feature?.properties?.name || slug
        const zone = slug ? zoneBySlug.value.get(slug) : null
        const priceM2 = zone ? props.notariadoData?.get(zone.id) : null

        const tooltip = priceM2
          ? `<strong>${name}</strong><br/>${priceM2.toLocaleString('es-ES')} €/m²`
          : `<strong>${name}</strong>`

        layer.bindTooltip(tooltip, { sticky: true })

        // Hover highlight
        layer.on('mouseover', () => {
          layer.setStyle({
            weight: 3,
            fillOpacity: 0.35,
          })
          layer.bringToFront()
        })

        layer.on('mouseout', () => {
          layer.setStyle({
            weight: 2,
            fillOpacity: 0.2,
          })
        })

        // Click to navigate
        if (slug) {
          layer.on('click', () => {
            navigateTo(`/zones/${slug}`)
          })
          layer.setStyle({ cursor: 'pointer' })
        }
      },
    }).addTo(map)
  }
  catch (err) {
    console.error('Failed to load district boundaries:', err)
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
  height: 450px;
  width: 100%;
  border-radius: var(--border-radius-lg);
  z-index: 0;
}

.zone-map :deep(.leaflet-interactive) {
  cursor: pointer;
}
</style>
