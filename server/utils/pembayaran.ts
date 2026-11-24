import type { PaymentStatus } from '../../app/generated/prisma/client'
import { prisma } from './prisma'

/**
 * Satu-satunya tempat yang boleh mengubah status pembayaran dan mengaktifkan
 * boost. Dipakai jalur polling (GET status) dan jalur webhook, supaya dua jalur
 * itu tidak mungkin berperilaku berbeda.
 *
 * Aman dipanggil berkali-kali: kalau pembayaran sudah lunas, tidak ada yang
 * berubah. Ini yang membuat boost tidak bisa diperpanjang dua kali oleh satu
 * tagihan yang sama.
 */
export async function terapkanStatusPembayaran(input: {
  orderId: string
  lunas: boolean
  gagal: boolean
  paidAt?: Date | null
  statusMentah: unknown
}) {
  const payment = await prisma.payment.findUnique({
    where: { orderId: input.orderId },
    include: { boost: { include: { package: true } } },
  })
  if (!payment) return { ditemukan: false, berubah: false, status: null as PaymentStatus | null }

  if (input.lunas && payment.status !== 'settled') {
    const now = input.paidAt ?? new Date()
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'settled',
          method: 'qris',
          paidAt: now,
          rawResponse: input.statusMentah as object,
        },
      }),
      prisma.boost.update({
        where: { id: payment.boostId },
        data: {
          status: 'active',
          startsAt: now,
          endsAt: new Date(now.getTime() + payment.boost.package.durationDays * 86400000),
        },
      }),
    ])
    return { ditemukan: true, berubah: true, status: 'settled' as PaymentStatus }
  }

  if (input.gagal && payment.status === 'pending') {
    // EXPIRED dan FAILED sama-sama berarti tidak ada uang masuk. Keduanya
    // disimpan sebagai 'failed' supaya status pembayaran tetap sederhana.
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed', rawResponse: input.statusMentah as object },
      }),
      prisma.boost.update({ where: { id: payment.boostId }, data: { status: 'failed' } }),
    ])
    return { ditemukan: true, berubah: true, status: 'failed' as PaymentStatus }
  }

  return { ditemukan: true, berubah: false, status: payment.status }
}
