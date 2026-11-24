import { pembayaranSiap } from '../../utils/miomipay'

/**
 * Cek konfigurasi pembayaran tanpa membocorkan kunci. Halaman boost memakainya
 * untuk menampilkan pesan yang jelas kalau kunci belum diisi.
 */
export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  const apiKey = String(config.miomipayApiKey ?? '')
  return {
    siap: pembayaranSiap(),
    penyedia: 'MiomiPay',
    kunciTerisi: apiKey.length > 0,
    modeSandbox: apiKey.startsWith('MP-SB-'),
    baseUrlTerisi: String(config.miomipayBaseUrl ?? '').length > 0,
    webhookSecretTerisi: String(config.miomipayWebhookSecret ?? '').length > 0,
  }
})
