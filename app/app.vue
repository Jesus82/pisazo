<script setup lang="ts">
const config = useRuntimeConfig()

useHead({
  htmlAttrs: { lang: 'es' },
  titleTemplate: '%s — Pisazo',
  meta: [
    { name: 'description', content: 'Seguimiento de precios de vivienda en A Coruña. Datos de Idealista y Notariado.' },
    { property: 'og:site_name', content: config.public.siteName },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  ],
})
</script>

<template>
  <div class="l-general">
    <header class="l-header">
      <nav class="l-container u-flex u-items-center u-justify-between u-py-half">
        <NuxtLink to="/" class="u-font-display u-text-xl u-font-bold u-no-underline">
          Pisazo
        </NuxtLink>
        <div class="u-flex u-gap-16">
          <NuxtLink to="/" class="nav-link">
            Inicio
          </NuxtLink>
          <NuxtLink to="/insights" class="nav-link">
            Análisis
          </NuxtLink>
        </div>
      </nav>
    </header>

    <main class="l-main">
      <NuxtPage />
    </main>

    <footer class="l-footer u-bg-gris-90 u-text-gris-30 u-py-second">
      <div class="l-container u-text-sm">
        <p>Pisazo — Seguimiento de precios de vivienda en A Coruña</p>
        <p class="u-mt-8">
          Datos de <a href="https://www.idealista.com" target="_blank" rel="noopener">Idealista</a>
          y <a href="https://www.penotariado.com" target="_blank" rel="noopener">Portal del Notariado</a>.
        </p>
      </div>
    </footer>
  </div>
</template>

<style>
.l-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--white);
  border-bottom: 1px solid var(--gris-10);
}

.l-footer a {
  color: var(--blue-light);
}

.l-footer a:hover {
  color: var(--white);
}

.nav-link {
  color: var(--gris-60);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: color 0.2s var(--ease-out-quad);
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--blue);
}
</style>
