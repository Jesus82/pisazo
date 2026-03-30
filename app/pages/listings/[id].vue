<script setup lang="ts">
const route = useRoute()
const id = computed(() => route.params.id as string)

const { data: listing } = await useListing(id)

useHead({
  title: computed(() => listing.value?.address ?? 'Piso'),
})

const daysOnMarket = computed(() => {
  if (!listing.value) return null
  const first = new Date(listing.value.firstSeen)
  const last = new Date(listing.value.lastSeen)
  return Math.floor((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24))
})

const currentPrice = computed(() => {
  if (!listing.value?.priceHistory.length) return null
  return listing.value.priceHistory[listing.value.priceHistory.length - 1]
})

const priceChange = computed(() => {
  if (!listing.value || listing.value.priceHistory.length < 2) return null
  const first = listing.value.priceHistory[0].price
  const last = listing.value.priceHistory[listing.value.priceHistory.length - 1].price
  if (!first || !last) return null
  return ((last - first) / first) * 100
})
</script>

<template>
  <div class="l-section">
    <div class="l-container l-container--large">
      <NuxtLink to="/" class="u-text-sm u-text-gris-50 u-mb-half u-block">
        &larr; Volver
      </NuxtLink>

      <template v-if="listing">
        <h1 class="u-text-2xl u-font-bold u-mb-eighth">
          {{ listing.address || 'Dirección no disponible' }}
        </h1>

        <div class="u-flex u-gap-16 u-flex-wrap u-mb-second u-text-sm u-text-gris-50">
          <span v-if="listing.propertyType">{{ listing.propertyType }}</span>
          <span v-if="listing.sizeM2">{{ listing.sizeM2 }} m²</span>
          <span v-if="listing.bedrooms">{{ listing.bedrooms }} hab.</span>
          <span v-if="listing.bathrooms">{{ listing.bathrooms }} baños</span>
          <span v-if="listing.floor">Planta {{ listing.floor }}</span>
        </div>

        <!-- Price summary -->
        <div class="l-grid l-grid--3 u-mb-second">
          <div class="metric-card">
            <span class="metric-label">Precio actual</span>
            <span class="metric-value">
              {{ currentPrice?.price
                ? `€${currentPrice.price.toLocaleString('es-ES')}`
                : '—' }}
            </span>
          </div>
          <div class="metric-card">
            <span class="metric-label">€/m²</span>
            <span class="metric-value">
              {{ currentPrice?.priceM2
                ? `€${Math.round(currentPrice.priceM2).toLocaleString('es-ES')}`
                : '—' }}
            </span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Días en mercado</span>
            <span class="metric-value">{{ daysOnMarket ?? '—' }}</span>
          </div>
        </div>

        <!-- Price change badge -->
        <div v-if="priceChange !== null" class="u-mb-second">
          <span :class="['price-change', priceChange < 0 ? 'price-down' : 'price-up']">
            {{ priceChange > 0 ? '+' : '' }}{{ priceChange.toFixed(1) }}%
            desde primera publicación
          </span>
        </div>

        <!-- Price history chart placeholder -->
        <div class="chart-placeholder u-mb-second">
          <p class="u-text-gris-40 u-text-sm">
            Historial de precios — próximamente
          </p>
        </div>

        <!-- Price history table -->
        <h2 class="u-text-lg u-font-bold u-mb-half">
          Historial de precios
        </h2>
        <table v-if="listing.priceHistory.length" class="price-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Precio</th>
              <th>€/m²</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="snapshot in listing.priceHistory" :key="snapshot.id">
              <td>{{ snapshot.date }}</td>
              <td>{{ snapshot.price ? `€${snapshot.price.toLocaleString('es-ES')}` : '—' }}</td>
              <td>{{ snapshot.priceM2 ? `€${Math.round(snapshot.priceM2).toLocaleString('es-ES')}` : '—' }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Features -->
        <div class="u-mt-second u-flex u-gap-8 u-flex-wrap">
          <span v-if="listing.hasElevator" class="feature-tag">Ascensor</span>
          <span v-if="listing.hasTerrace" class="feature-tag">Terraza</span>
          <span v-if="listing.hasGarage" class="feature-tag">Garaje</span>
        </div>

        <!-- Link to Idealista -->
        <div v-if="listing.idealistaUrl" class="u-mt-second">
          <a
            :href="listing.idealistaUrl"
            target="_blank"
            rel="noopener"
            class="u-text-sm"
          >
            Ver en Idealista &rarr;
          </a>
        </div>
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
}

.price-change {
  display: inline-block;
  padding: var(--spacing-eighth) var(--spacing-quarter);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.price-down {
  background: var(--green-light);
  color: var(--green-dark);
}

.price-up {
  background: var(--red-light);
  color: var(--red-dark);
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

.price-table th {
  text-align: left;
  font-size: var(--font-size-xs);
  color: var(--gris-50);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--spacing-eighth) var(--spacing-quarter);
  border-bottom: 2px solid var(--gris-10);
}

.price-table td {
  padding: var(--spacing-eighth) var(--spacing-quarter);
  border-bottom: 1px solid var(--gris-5);
  font-size: var(--font-size-sm);
}

.feature-tag {
  display: inline-block;
  padding: var(--spacing-sixteenth) var(--spacing-quarter);
  background: var(--blue-lightest);
  color: var(--blue-dark);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
}
</style>
