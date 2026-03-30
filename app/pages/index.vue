<script setup lang="ts">
useHead({ title: 'Inicio' })

const { data: zones } = await useZones()
</script>

<template>
  <div class="l-section">
    <div class="l-container">
      <h1 class="u-text-3xl u-font-bold u-mb-base">
        Precios de vivienda en A Coruña
      </h1>
      <p class="u-text-md u-text-gris-60 u-mb-second">
        Seguimiento diario de precios de pisos en venta. Datos de Idealista contrastados con
        los precios reales del Notariado.
      </p>

      <!-- Zone Cards -->
      <div class="l-grid l-grid--3 u-mb-fourth">
        <NuxtLink
          v-for="zone in zones"
          :key="zone.id"
          :to="`/zones/${zone.slug}`"
          class="zone-card"
        >
          <h2 class="u-text-lg u-font-bold u-mb-eighth">
            {{ zone.name }}
          </h2>
          <p class="u-text-sm u-text-gris-50">
            CP {{ zone.postalCode }}
          </p>
        </NuxtLink>
      </div>

      <!-- Placeholder for map -->
      <div class="map-placeholder u-mb-second">
        <p class="u-text-gris-40 u-text-sm">
          Mapa interactivo — próximamente
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.map-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: var(--gris-2);
  border: 2px dashed var(--gris-15);
  border-radius: var(--border-radius-lg);
}
</style>
