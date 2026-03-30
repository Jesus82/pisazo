<script setup lang="ts">
import type { Zone, NotariadoStat } from '~/types'

useHead({ title: 'Inicio' })

interface ZoneNotariado {
  zone: Zone
  stat: NotariadoStat | null
}

const { data: zonesWithStats } = await useAsyncData('notariado-overview', () =>
  $fetch<ZoneNotariado[]>('/api/notariado'),
  { default: () => [] },
)

const zones = computed(() => zonesWithStats.value.map(z => z.zone))

const notariadoMap = computed(() => {
  const map = new Map<number, number>()
  for (const zs of zonesWithStats.value) {
    if (zs.stat?.avgPriceM2) {
      map.set(zs.zone.id, zs.stat.avgPriceM2)
    }
  }
  return map
})

const chartData = computed(() =>
  zonesWithStats.value
    .filter(zs => zs.stat)
    .map(zs => ({ name: zs.zone.name, stat: zs.stat! })),
)

// Summary stats
const avgPriceM2 = computed(() => {
  const vals = zonesWithStats.value.map(z => z.stat?.avgPriceM2).filter(Boolean) as number[]
  if (!vals.length) return null
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
})

const totalTransactions = computed(() => {
  const vals = zonesWithStats.value.map(z => z.stat?.numTransactions).filter(Boolean) as number[]
  return vals.reduce((s, v) => s + v, 0)
})

const avgTotalPrice = computed(() => {
  const vals = zonesWithStats.value.map(z => z.stat?.avgTotalPrice).filter(Boolean) as number[]
  if (!vals.length) return null
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
})
</script>

<template>
  <div class="l-section">
    <div class="l-container">
      <h1 class="u-text-3xl u-font-bold u-mb-eighth">
        Precios de vivienda en A Coru&ntilde;a
      </h1>
      <p class="u-text-md u-text-gris-60 u-mb-second">
        Precios reales de compraventa seg&uacute;n el Notariado. Datos de los &uacute;ltimos 12 meses.
      </p>

      <!-- Summary Cards -->
      <div class="l-grid l-grid--3 u-mb-second">
        <div class="summary-card">
          <span class="summary-label">Precio medio/m&sup2;</span>
          <span class="summary-value">
            {{ avgPriceM2 ? `${avgPriceM2.toLocaleString('es-ES')} €` : '—' }}
          </span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Precio medio vivienda</span>
          <span class="summary-value">
            {{ avgTotalPrice ? `${avgTotalPrice.toLocaleString('es-ES')} €` : '—' }}
          </span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Transacciones (12 meses)</span>
          <span class="summary-value">
            {{ totalTransactions ? totalTransactions.toLocaleString('es-ES') : '—' }}
          </span>
        </div>
      </div>

      <!-- Map -->
      <h2 class="u-text-xl u-font-bold u-mb-half">
        Mapa de zonas
      </h2>
      <p class="u-text-sm u-text-gris-50 u-mb-half">
        Pulsa una zona para ver sus detalles. Color seg&uacute;n precio/m&sup2;.
      </p>
      <ClientOnly>
        <ZoneMap :zones="zones" :notariado-data="notariadoMap" />
        <template #fallback>
          <div class="map-fallback">Cargando mapa...</div>
        </template>
      </ClientOnly>

      <!-- Notariado Bar Chart -->
      <h2 class="u-text-xl u-font-bold u-mt-second u-mb-half">
        Precio real por zona (€/m&sup2;)
      </h2>
      <p class="u-text-sm u-text-gris-50 u-mb-half">
        Datos del Portal Estad&iacute;stico del Notariado — precios reales de escritura.
      </p>
      <NotariadoBarChart v-if="chartData.length" :data="chartData" />

      <!-- Zone Cards Grid -->
      <h2 class="u-text-xl u-font-bold u-mt-second u-mb-half">
        Zonas
      </h2>
      <div class="l-grid l-grid--3 u-mb-fourth">
        <NuxtLink
          v-for="zs in zonesWithStats"
          :key="zs.zone.id"
          :to="`/zones/${zs.zone.slug}`"
          class="zone-card"
        >
          <h3 class="u-text-lg u-font-bold u-mb-eighth">
            {{ zs.zone.name }}
          </h3>
          <p class="u-text-sm u-text-gris-50 u-mb-eighth">
            CP {{ zs.zone.postalCode }}
          </p>
          <div v-if="zs.stat" class="zone-stats">
            <span class="zone-stat-value">{{ zs.stat.avgPriceM2?.toLocaleString('es-ES') }} €/m²</span>
            <span class="zone-stat-label">
              {{ zs.stat.avgTotalPrice?.toLocaleString('es-ES') }} € medio
            </span>
          </div>
          <p v-else class="u-text-xs u-text-gris-40">
            Sin datos
          </p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-eighth);
  padding: var(--spacing-base);
  background: var(--blue-darkest);
  color: var(--white);
  border-radius: var(--border-radius-lg);
}

.summary-label {
  font-size: var(--font-size-xs);
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
}

.zone-card {
  display: block;
  padding: var(--spacing-base);
  background: var(--white);
  border: 1px solid var(--gris-10);
  border-radius: var(--border-radius-lg);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s var(--ease-out-quad), box-shadow 0.2s var(--ease-out-quad);
}

.zone-card:hover {
  border-color: var(--blue-lighter);
  box-shadow: var(--shadow-md);
}

.zone-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.zone-stat-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--blue-dark);
}

.zone-stat-label {
  font-size: var(--font-size-xs);
  color: var(--gris-50);
}

.map-fallback {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gris-2);
  border-radius: var(--border-radius-lg);
  color: var(--gris-40);
}
</style>
