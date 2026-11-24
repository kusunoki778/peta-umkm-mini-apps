import { requireAuth } from '../../../utils/auth'
import { cekStatusTagihan } from '../../../utils/miomipay'
import { terapkanStatusPembayaran } from '../../../utils/pembayaran'
import { prisma } from '../../../utils/prisma'
import { fail } from '../../../utils/errors'

/**
 * Tanya status pembayaran ke MiomiPay, lalu aktifkan boost kalau sudah lunas.
 *
 * Ini jalur utama aktivasi, bukan webhook, karena aplikasi sering berjalan di
 * localhost yang tidak bisa dijangkau dari internet. Permintaan ini keluar dari
 * server kita, jadi tidak butuh tunnel.
 *
 * Hanya pemilik lapaknya yang boleh memanggil, dan tagihan harus miliknya.
 */
export default defineEventHandler(async event => {
  const user = await requireAuth(event)
  const orderId = getRouterParam(event, 'orderId')
  if (!orderId) return fail(400, 'Nomor pesanan tidak ada.')

  const payment = await prisma.payment.findUnique({
    where: { orderId },
    select: {
      id: true,
      orderId: true,
      status: true,
      providerRef: true,
      boost: { select: { business: { select: { ownerId: true } } } },
    },
  })
  if (!payment) return fail(404, 'Pesanan tidak ditemukan.')
  if (payment.boost.business.ownerId !== user.id) {
    return fail(403, 'Pesanan ini milik akun lain.')
  }
  if (!payment.providerRef) {
    return fail(409, 'Pesanan ini tidak punya nomor referensi pembayaran.')
  }

  const status = await cekStatusTagihan(payment.providerRef)
  const hasil = await terapkanStatusPembayaran({
    orderId: payment.orderId,
    lunas: status.lunas,
    gagal: status.gagal,
    paidAt: status.paidAt,
    statusMentah: status.mentah,
  })

  return {
    orderId: payment.orderId,
    statusMirip: status.status,
    statusPembayaran: hasil.status,
    lunas: hasil.status === 'settled',
    aktif: hasil.berubah && hasil.status === 'settled',
    checkoutUrl: status.checkoutUrl,
  }
})
