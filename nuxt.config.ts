import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/fonts', '@nuxt/eslint', 'nuxt-auth-utils'],
  runtimeConfig: {
    midtransServerKey: '',
    // nuxt-auth-utils menyetel cookie sesi `Secure` secara bawaan. Saat pratinjau
    // build produksi di mesin lokal, aplikasi disajikan lewat http, jadi cookie
    // itu ditolak browser dan pengguna tidak pernah benar-benar masuk.
    // Aktifkan NUXT_SESSION_COOKIE_SECURE=false hanya untuk pratinjau lokal;
    // deployment sungguhan (https) membiarkan bawaan Secure.
    session: {
      cookie: {
        secure: process.env.NUXT_SESSION_COOKIE_SECURE === 'false' ? false : undefined,
      },
    },
    public: {
      midtransClientKey: '',
      midtransIsProduction: false,
    },
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      titleTemplate: '%s | Lapak Peta',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Peta lapak UMKM di sekitar kampus: tempat makan, kos, dan jasa.',
        },
      ],
    },
  },
  fonts: {
    families: [
      { name: 'Plus Jakarta Sans', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'Fraunces', provider: 'google', weights: [500, 600] },
    ],
  },
})
