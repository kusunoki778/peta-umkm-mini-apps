import { verifikasiTandaTangan } from '../../utils/miomipay'
import { terapkanStatusPembayaran } from '../../utils/pembayaran'

/**
 * Webhook MiomiPay. Bukan jalur utama, karena aplikasi di localhost tidak bisa
 * dijangkau dari internet. Tetap disediakan supaya deployment sungguhan bisa
 * mengaktifkan boost tanpa menunggu pembeli membuka halaman lagi.
 *
 * Tanda tangan dihitung dari isi mentah request, bukan dari hasil parse JSON.
 * Urutan kunci dan spasi bisa berubah saat di-parse ulang, dan itu akan membuat
 * tanda tangan yang sebenarnya valid terlihat palsu.
 */
export default defineEventHandler(async event => {
  const isiMentah = await readRawBody(event, 'utf8')
  const tandaTangan = getHeader(event, 'x-miomipay-signature') ?? ''
  if (!isiMentah || !verifikasiTandaTangan(isiMentah, tandaTangan)) {
    throw createError({ statusCode: 401, statusMessage: 'Tanda tangan webhook tidak valid.' })
  }

  let body: {
    event?: string
    data?: { reference?: string; external_id?: string; status?: string; paid_at?: string | null }
  }
  try {
    body = JSON.parse(isiMentah)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Isi webhook bukan JSON.' })
  }

  const orderId = body.data?.external_id
  if (!orderId) throw createError({ statusCode: 422, statusMessage: 'Webhook tanpa external_id.' })

  const status = String(body.data?.status ?? '').toUpperCase()
  const hasil = await terapkanStatusPembayaran({
    orderId,
    lunas: ['PAID', 'SETTLEMENT', 'SUCCESS'].includes(status),
    gagal: ['EXPIRED', 'FAILED', 'CANCELLED', 'CANCEL'].includes(status),
    paidAt: body.data?.paid_at ? new Date(body.data.paid_at) : null,
    statusMentah: body,
  })

  // Pesanan yang tidak dikenal tetap dijawab 200 supaya MiomiPay berhenti
  // mencoba ulang. Isinya dicatat lewat status agar mudah dilacak.
  return { ok: true, ditemukan: hasil.ditemukan, berubah: hasil.berubah }
})
