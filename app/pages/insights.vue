<script setup lang="ts">
useHead({ title: 'Análisis de mercado' })

const { data: zones } = await useZones()
</script>

<template>
  <div class="l-section">
    <div class="l-container">
      <h1 class="u-text-3xl u-font-bold u-mb-base">
        Análisis de mercado
      </h1>
      <p class="u-text-md u-text-gris-60 u-mb-second">
        Tendencias, comparativas y estadísticas del mercado inmobiliario en A Coruña.
      </p>

      <!-- Coming soon notice -->
      <div class="coming-soon">
        <h2 class="u-text-xl u-font-bold u-mb-half">
          Próximamente
        </h2>
        <p class="u-text-gris-50 u-mb-base">
          Esta sección mostrará análisis detallados cuando tengamos suficientes datos históricos.
        </p>
        <ul class="u-text-sm u-text-gris-60 feature-list">
          <li>Evolución de precios por zona</li>
          <li>Comparativa precios de Idealista vs precios reales del Notariado</li>
          <li>Tiempo medio de venta (estimado)</li>
          <li>Frecuencia y magnitud de bajadas de precio</li>
          <li>Patrones estacionales</li>
          <li>Distribución de precios por tipo de vivienda</li>
        </ul>
      </div>

      <!-- Zone summary cards -->
      <h2 class="u-text-xl u-font-bold u-mt-fourth u-mb-half">
        Zonas en seguimiento
      </h2>
      <div class="l-grid l-grid--3">
        <div v-for="zone in zones" :key="zone.id" class="zone-summary">
          <NuxtLink :to="`/zones/${zone.slug}`" class="u-font-bold">
            {{ zone.name }}
          </NuxtLink>
          <p class="u-text-xs u-text-gris-50">
            CP {{ zone.postalCode }} · Radio {{ zone.radiusM }}m
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.coming-soon {
  padding: var(--spacing-second);
  background: var(--gris-2);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--gris-10);
}

.feature-list {
  list-style: disc;
  padding-left: var(--spacing-base);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-eighth);
}

.zone-summary {
  padding: var(--spacing-half);
  border: 1px solid var(--gris-10);
  border-radius: var(--border-radius-md);
}
</style>
