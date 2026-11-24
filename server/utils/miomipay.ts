import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Klien MiomiPay. Semua komunikasi keluar dari server ke API mereka, jadi alur
 * pembayaran tetap jalan walau aplikasi berjalan di localhost tanpa tunnel.
 *
 * Kenapa tidak mengandalkan webhook saja: webhook masuk ke aplikasi kita, dan
 * Midtrans maupun MiomiPay tidak bisa menjangkau `localhost`. Karena itu sumber
 * kebenaran status pembayaran di sini adalah `GET /payment/:reference/status`,
 * sedangkan webhook hanya jalur cadangan saat aplikasi sudah punya alamat publik.
 */

interface TagihanResponse {
  success: boolean
  message?: string
  data?: {
    reference: string
    external_id: string
    status: string
    amount: number
    final_amount: number
    qr_string: string
    qr_image_url: string
    snap_token: string
    checkout_url: string
    paid_at?: string | null
    expired_at?: string
  }
}

interface StatusResponse {
  success: boolean
  message?: string
  data?: {
    reference: string
    external_id: string
    status: string
    amount: number
    final_amount: number
    qr_image_url?: string
    checkout_url?: string
    paid_at?: string | null
    expired_at?: string
  }
}

/** Status yang dianggap sudah dibayar. Selain ini belum bisa mengaktifkan boost. */
const STATUS_LUNAS = new Set(['PAID', 'SETTLEMENT', 'SUCCESS'])
/** Status yang menutup transaksi tanpa uang masuk. */
const STATUS_GAGAL = new Set(['EXPIRED', 'FAILED', 'CANCELLED', 'CANCEL'])

function konfigurasi() {
  const config = useRuntimeConfig()
  const apiKey = String(config.miomipayApiKey ?? '')
  const webhookSecret = String(config.miomipayWebhookSecret ?? '')
  const baseUrl = String(config.miomipayBaseUrl ?? '').replace(/\/+$/, '')
  return { apiKey, webhookSecret, baseUrl }
}

function pastikanSiap() {
  const { apiKey, baseUrl } = konfigurasi()
  if (!apiKey) {
    throw fail(503, 'Kunci MiomiPay belum diisi. Hubungi pengelola aplikasi.')
  }
  if (!baseUrl) {
    throw fail(503, 'Alamat API MiomiPay belum diisi. Hubungi pengelola aplikasi.')
  }
  return { apiKey, baseUrl }
}

function pesanDariError(error: unknown) {
  const body = (error as { data?: { message?: string } })?.data
  if (body?.message) return body.message
  if (error instanceof Error && error.message) return error.message
  return ''
}

/** Buat tagihan QRIS. Hasilnya dipakai halaman boost untuk menampilkan QR. */
export async function buatTagihan(input: {
  orderId: string
  amount: number
  description: string
  customer: { name: string; email: string; phone?: string | null }
}) {
  const { apiKey, baseUrl } = pastikanSiap()

  let respons: TagihanResponse
  try {
    respons = await $fetch<TagihanResponse>(`${baseUrl}/payment/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: {
        external_id: input.orderId,
        amount: input.amount,
        customer_name: input.customer.name,
        customer_email: input.customer.email,
        // Nomor telepon tidak wajib di MiomiPay, jadi jangan kirim undefined mentah.
        ...(input.customer.phone ? { customer_phone: input.customer.phone } : {}),
        description: input.description,
      },
    })
  } catch (error) {
    // Tanpa ini pengguna hanya melihat 500 generik dan sebabnya tidak pernah sampai.
    const detail = pesanDariError(error)
    throw fail(
      502,
      detail
        ? `MiomiPay menolak pembuatan tagihan: ${detail}`
        : 'MiomiPay menolak pembuatan tagihan. Periksa kunci API.',
    )
  }

  const data = respons?.data
  if (!data?.reference) {
    throw fail(502, 'MiomiPay tidak mengembalikan nomor referensi tagihan.')
  }

  return {
    reference: data.reference,
    checkoutUrl: data.checkout_url,
    qrImageUrl: data.qr_image_url,
    qrString: data.qr_string,
    snapToken: data.snap_token,
    status: data.status,
    amount: data.final_amount ?? data.amount,
    expiresAt: data.expired_at ?? null,
  }
}

/** Baca status tagihan dari server MiomiPay. Ini sumber kebenaran, bukan webhook. */
export async function cekStatusTagihan(reference: string) {
  const { apiKey, baseUrl } = pastikanSiap()

  let respons: StatusResponse
  try {
    respons = await $fetch<StatusResponse>(
      `${baseUrl}/payment/${encodeURIComponent(reference)}/status`,
      {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      },
    )
  } catch (error) {
    // 404 berarti tagihannya memang tidak dikenal di sisi mereka.
    const kode = (error as { statusCode?: number; response?: { status?: number } })?.statusCode
    if (kode === 404) {
      throw fail(404, 'Tagihan ini tidak dikenal oleh MiomiPay.')
    }
    const detail = pesanDariError(error)
    throw fail(
      502,
      detail
        ? `Status pembayaran gagal diperiksa: ${detail}`
        : 'Status pembayaran gagal diperiksa.',
    )
  }

  const data = respons?.data
  if (!data?.status) {
    throw fail(502, 'MiomiPay tidak mengembalikan status tagihan.')
  }

  const status = String(data.status).toUpperCase()
  return {
    reference: data.reference ?? reference,
    status,
    lunas: STATUS_LUNAS.has(status),
    gagal: STATUS_GAGAL.has(status),
    paidAt: data.paid_at ? new Date(data.paid_at) : null,
    amount: data.final_amount ?? data.amount,
    qrImageUrl: data.qr_image_url ?? null,
    checkoutUrl: data.checkout_url ?? null,
    mentah: data,
  }
}

/**
 * Verifikasi tanda tangan webhook: HMAC-SHA256 dari body mentah, dibandingkan
 * dengan header `X-MiomiPay-Signature`. Panjangnya diperiksa lebih dulu supaya
 * `timingSafeEqual` tidak melempar error saat header kosong atau ngawur.
 */
export function verifikasiTandaTangan(isiMentah: string, tandaTangan: string) {
  const { webhookSecret } = konfigurasi()
  if (!webhookSecret || !tandaTangan) return false
  const diharapkan = createHmac('sha256', webhookSecret).update(isiMentah).digest('hex')
  const a = Buffer.from(tandaTangan.toLowerCase())
  const b = Buffer.from(diharapkan)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Apakah kunci API sudah terisi. Dipakai halaman boost untuk pesan yang jelas. */
export function pembayaranSiap() {
  const { apiKey, baseUrl } = konfigurasi()
  return apiKey.length > 0 && baseUrl.length > 0
}
