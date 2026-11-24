/** Cek konfigurasi Midtrans tanpa membocorkan secret. Dipakai halaman boost untuk
 *  menampilkan pesan yang jelas kalau kunci belum diisi. */
export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  const serverKey = String(config.midtransServerKey ?? '')
  const clientKey = String(config.public.midtransClientKey ?? '')
  return {
    serverKeySet: serverKey.length > 0,
    clientKeySet: clientKey.length > 0,
    serverKeySandbox: serverKey.startsWith('SB-Mid-server-'),
    clientKeySandbox: clientKey.startsWith('SB-Mid-client-'),
    isProduction: Boolean(config.public.midtransIsProduction),
    snapScriptUrl: config.public.midtransIsProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js',
  }
})
