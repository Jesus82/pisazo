// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    '@nuxtjs/sitemap',
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@nuxt/image',
    'dayjs-nuxt',
    'nuxt-schema-org',
  ],

  components: {
    dirs: [
      {
        path: '~/components',
        pathPrefix: false,
      },
    ],
  },

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
      '@csstools/postcss-global-data': {
        files: ['./app/assets/css/utilities/media-queries.css'],
      },
      'postcss-custom-media': {},
    },
  },

  site: {
    url: process.env.NUXT_SITE_URL || 'https://pisazo.netlify.app',
    name: 'Pisazo',
  },

  dayjs: {
    locales: ['es'],
    defaultLocale: 'es',
  },

  experimental: {
    viewTransition: true,
  },

  runtimeConfig: {
    tursoDbUrl: '',
    tursoAuthToken: '',
    idealistaApiKey: '',
    idealistaApiSecret: '',
    public: {
      siteUrl: '',
      siteName: 'Pisazo',
    },
  },

  image: {
    screens: {
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1500,
    },
  },

  nitro: {
    preset: 'netlify',
  },
})
