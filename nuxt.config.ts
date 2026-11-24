import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/fonts', '@nuxt/eslint', 'nuxt-auth-utils'],
  runtimeConfig: {
    // Kunci ini dibaca Nitro dari env dengan nama NUXT_MIDTRANS_SERVER_KEY.
    // Nilai di bawah hanya cadangan saat env tidak ada, dan sengaja memakai
    // process.env supaya nama lama (MIDTRANS_SERVER_KEY) tetap terbaca.
    midtransServerKey:
      process.env.NUXT_MIDTRANS_SERVER_KEY ?? process.env.MIDTRANS_SERVER_KEY ?? '',
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
      midtransClientKey: process.env.NUXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '',
      midtransIsProduction: process.env.NUXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true',
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
          content: 'Peta lapak UMKM di sekitar kampus: tempat makan, kos, dan jasa.',
        },
      ],
      // Tema dibaca sebelum badan halaman digambar. Tanpa ini, pengguna mode
      // gelap melihat kedip putih setiap kali halaman dimuat ulang.
      script: [
        {
          key: 'tema-awal',
          innerHTML: `try{var t=localStorage.getItem('lapak-peta-tema');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'gelap':'terang'}if(t==='gelap'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}}catch(e){}`,
          tagPosition: 'head',
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
