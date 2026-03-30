<script setup lang="ts">
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { data: zone } = await useZone(slug)
const { data: listings } = await useListings(slug)

useHead({
  title: computed(() => zone.value?.name ?? 'Zona'),
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

        <!-- Metrics summary -->
        <div v-if="zone.metrics" class="l-grid l-grid--3 u-mb-second">
          <div class="metric-card">
            <span class="metric-label">Pisos activos</span>
            <span class="metric-value">{{ zone.metrics.numActiveListings ?? '—' }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Precio mediano</span>
            <span class="metric-value">
              {{ zone.metrics.medianAskingPrice
                ? `€${zone.metrics.medianAskingPrice.toLocaleString('es-ES')}`
                : '—' }}
            </span>
          </div>
          <div class="metric-card">
            <span class="metric-label">€/m² medio</span>
            <span class="metric-value">
              {{ zone.metrics.avgAskingPriceM2
                ? `€${zone.metrics.avgAskingPriceM2.toLocaleString('es-ES')}`
                : '—' }}
            </span>
          </div>
        </div>

        <!-- Chart placeholder -->
        <div class="chart-placeholder u-mb-second">
          <p class="u-text-gris-40 u-text-sm">
            Gráfica de evolución de precios — próximamente
          </p>
        </div>

        <!-- Listings table -->
        <h2 class="u-text-xl u-font-bold u-mb-half">
          Pisos en venta
        </h2>

        <div v-if="listings?.length" class="listings-table-wrapper">
          <table class="listings-table">
            <thead>
              <tr>
                <th>Dirección</th>
                <th>Tipo</th>
                <th>m²</th>
                <th>Hab.</th>
                <th>Precio</th>
                <th>€/m²</th>
                <th>Desde</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="listing in listings" :key="listing.id">
                <td>
                  <NuxtLink :to="`/listings/${listing.id}`">
                    {{ listing.address || 'Sin dirección' }}
                  </NuxtLink>
                </td>
                <td>{{ listing.propertyType ?? '—' }}</td>
                <td>{{ listing.sizeM2 ?? '—' }}</td>
                <td>{{ listing.bedrooms ?? '—' }}</td>
                <td class="u-font-bold">
                  {{ listing.currentPrice
                    ? `€${listing.currentPrice.toLocaleString('es-ES')}`
                    : '—' }}
                </td>
                <td>
                  {{ listing.currentPriceM2
                    ? `€${Math.round(listing.currentPriceM2).toLocaleString('es-ES')}`
                    : '—' }}
                </td>
                <td class="u-text-gris-50">{{ listing.firstSeen }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="u-text-gris-40">
          No hay pisos registrados aún en esta zona.
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-eighth);
  padding: var(--spacing-base);
  background: var(--gris-2);
  border-radius: var(--border-radius-md);
}

.metric-label {
  font-size: var(--font-size-xs);
  color: var(--gris-50);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.metric-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--gris-90);
}

.chart-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 250px;
  background: var(--gris-2);
  border: 2px dashed var(--gris-15);
  border-radius: var(--border-radius-lg);
}

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
