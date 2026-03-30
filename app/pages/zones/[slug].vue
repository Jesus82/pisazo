<script setup lang="ts">
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data: zone } = await useZone(slug)
const { data: listings } = await useListings(slug)
const { data: notariado } = await useNotariado(slug)

useHead({
  title: computed(() => zone.value?.name ?? 'Zona'),
})

const latestNotariado = computed(() => {
  if (!notariado.value?.stats.length) return null
  return notariado.value.stats[notariado.value.stats.length - 1]
})
</script>

<template>
  <div class="l-section">
    <div class="l-container">
      <NuxtLink to="/" class="u-text-sm u-text-gris-50 u-mb-half u-block">
        &larr; Volver al inicio
      </NuxtLink>

      <template v-if="zone">
        <h1 class="u-text-3xl u-font-bold u-mb-eighth">
          {{ zone.name }}
        </h1>
        <p class="u-text-gris-50 u-mb-second">
          CP {{ zone.postalCode }}
        </p>

        <!-- Notariado real price data -->
        <div v-if="latestNotariado" class="notariado-section u-mb-second">
          <h2 class="u-text-lg u-font-bold u-mb-half">
            Precios reales (Notariado)
          </h2>
          <p class="u-text-xs u-text-gris-50 u-mb-half">
            Datos de escrituras notariales — {{ latestNotariado.month }}
          </p>
          <div class="l-grid l-grid--3">
            <div class="metric-card metric-card--notariado">
              <span class="metric-label">Precio/m&sup2; real</span>
              <span class="metric-value">
                {{ latestNotariado.avgPriceM2?.toLocaleString('es-ES') }} €
              </span>
            </div>
            <div class="metric-card metric-card--notariado">
              <span class="metric-label">Precio medio</span>
              <span class="metric-value">
                {{ latestNotariado.avgTotalPrice?.toLocaleString('es-ES') }} €
              </span>
            </div>
            <div class="metric-card metric-card--notariado">
              <span class="metric-label">Transacciones</span>
              <span class="metric-value">{{ latestNotariado.numTransactions }}</span>
            </div>
          </div>
          <div class="l-grid l-grid--2 u-mt-half">
            <div class="metric-card">
              <span class="metric-label">Superficie media</span>
              <span class="metric-value">{{ latestNotariado.avgSurfaceM2 }} m&sup2;</span>
            </div>
            <div v-if="zone.metrics?.avgAskingPriceM2 && latestNotariado.avgPriceM2" class="metric-card">
              <span class="metric-label">Brecha Idealista vs Real</span>
              <span class="metric-value" :class="zone.metrics.askingVsNotariadoGap && zone.metrics.askingVsNotariadoGap > 0 ? 'gap-positive' : 'gap-negative'">
                {{ zone.metrics.askingVsNotariadoGap
                  ? `${zone.metrics.askingVsNotariadoGap > 0 ? '+' : ''}${zone.metrics.askingVsNotariadoGap.toFixed(1)}%`
                  : 'Pendiente datos Idealista' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Idealista metrics summary -->
        <div v-if="zone.metrics" class="u-mb-second">
          <h2 class="u-text-lg u-font-bold u-mb-half">
            Idealista (precio de oferta)
          </h2>
          <div class="l-grid l-grid--3">
            <div class="metric-card">
              <span class="metric-label">Pisos activos</span>
              <span class="metric-value">{{ zone.metrics.numActiveListings ?? '—' }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">Precio mediano</span>
              <span class="metric-value">
                {{ zone.metrics.medianAskingPrice
                  ? `${zone.metrics.medianAskingPrice.toLocaleString('es-ES')} €`
                  : '—' }}
              </span>
            </div>
            <div class="metric-card">
              <span class="metric-label">€/m&sup2; medio</span>
              <span class="metric-value">
                {{ zone.metrics.avgAskingPriceM2
                  ? `${zone.metrics.avgAskingPriceM2.toLocaleString('es-ES')} €`
                  : '—' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Listings table -->
        <h2 class="u-text-xl u-font-bold u-mb-half">
          Pisos en venta
        </h2>

        <div v-if="listings?.length" class="listings-table-wrapper">
          <table class="listings-table">
            <thead>
              <tr>
                <th>Direcci&oacute;n</th>
                <th>Tipo</th>
                <th>m&sup2;</th>
                <th>Hab.</th>
                <th>Precio</th>
                <th>€/m&sup2;</th>
                <th>Desde</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="listing in listings" :key="listing.id">
                <td>
                  <NuxtLink :to="`/listings/${listing.id}`">
                    {{ listing.address || 'Sin direcci&oacute;n' }}
                  </NuxtLink>
                </td>
                <td>{{ listing.propertyType ?? '—' }}</td>
                <td>{{ listing.sizeM2 ?? '—' }}</td>
                <td>{{ listing.bedrooms ?? '—' }}</td>
                <td class="u-font-bold">
                  {{ listing.currentPrice
                    ? `${listing.currentPrice.toLocaleString('es-ES')} €`
                    : '—' }}
                </td>
                <td>
                  {{ listing.currentPriceM2
                    ? `${Math.round(listing.currentPriceM2).toLocaleString('es-ES')} €`
                    : '—' }}
                </td>
                <td class="u-text-gris-50">{{ listing.firstSeen }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="u-text-gris-40 u-text-sm">
          No hay pisos de Idealista a&uacute;n. Los datos se cargar&aacute;n cuando tengamos acceso a la API.
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.notariado-section {
  padding: var(--spacing-base);
  background: var(--blue-lightest);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--blue-lighter);
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-eighth);
  padding: var(--spacing-half);
  background: var(--white);
  border-radius: var(--border-radius-md);
}

.metric-card--notariado {
  background: var(--white);
}

.metric-label {
  font-size: var(--font-size-xs);
  color: var(--gris-50);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.metric-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--gris-90);
}

.gap-positive { color: var(--red); }
.gap-negative { color: var(--green-dark); }

.listings-table-wrapper {
  overflow-x: auto;
}

.listings-table {
  min-width: 700px;
}

.listings-table th {
  text-align: left;
  font-size: var(--font-size-xs);
  color: var(--gris-50);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--spacing-eighth) var(--spacing-quarter);
  border-bottom: 2px solid var(--gris-10);
}

.listings-table td {
  padding: var(--spacing-eighth) var(--spacing-quarter);
  border-bottom: 1px solid var(--gris-5);
  font-size: var(--font-size-sm);
}

.listings-table tbody tr:hover {
  background: var(--gris-2);
}
</style>
