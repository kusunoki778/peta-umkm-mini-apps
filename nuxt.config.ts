import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/fonts', '@nuxt/eslint', 'nuxt-auth-utils'],
  runtimeConfig: {
    // Kunci MiomiPay hanya dipakai di server, jadi tidak pernah ikut ke bundel
    // klien. Nilai di bawah dibaca dari env dengan nama lama (MIOMIPAY_*) supaya
    // .env yang sudah ada tetap terbaca tanpa diubah.
    miomipayApiKey: process.env.NUXT_MIOMIPAY_API_KEY ?? process.env.MIOMIPAY_SANDBOX_KEY ?? '',
    miomipayWebhookSecret:
      process.env.NUXT_MIOMIPAY_WEBHOOK_SECRET ?? process.env.MIOMIPAY_WEBHOOK_SECRET ?? '',
    miomipayBaseUrl:
      process.env.NUXT_MIOMIPAY_BASE_URL ??
      process.env.MIOMIPAY_BASE_URL ??
      'https://pg.miomidev.com/api/v1',
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
      // Tidak ada kunci pembayaran di sini. Semua permintaan ke MiomiPay
      // dilakukan dari server supaya kunci API tidak bisa dibaca pengunjung.
    },
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      titleTemplate: '%s | Ndekat',
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
