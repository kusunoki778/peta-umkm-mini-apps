import { randomUUID } from 'node:crypto'
import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { requireOwnedBusiness } from '../../utils/business'
import { buatTagihan } from '../../utils/miomipay'
import { fail } from '../../utils/errors'

export default defineEventHandler(async event => {
  const user = await requireAuth(event)
  const body = await readBody<{ businessId?: string; packageId?: number }>(event)
  if (!body.businessId || !body.packageId) return fail(422, 'Lapak dan paket wajib dipilih.')
  const business = await requireOwnedBusiness(body.businessId, user)
  const pack = await prisma.boostPackage.findFirst({ where: { id: body.packageId, active: true } })
  if (!pack) return fail(404, 'Paket boost tidak ditemukan.')
  const existing = await prisma.boost.findFirst({
    where: { businessId: business.id, status: 'active', endsAt: { gt: new Date() } },
  })
  if (existing) return fail(409, 'Lapak ini masih memiliki boost aktif.')

  const orderId = `boost-${randomUUID()}`
  const boost = await prisma.boost.create({ data: { businessId: business.id, packageId: pack.id } })
  const payment = await prisma.payment.create({
    data: { orderId, boostId: boost.id, amount: pack.price },
  })

  try {
    const tagihan = await buatTagihan({
      orderId,
      amount: pack.price,
      description: `Boost ${pack.name} untuk ${business.name}`,
      customer: user,
    })
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerRef: tagihan.reference,
        checkoutUrl: tagihan.checkoutUrl,
        qrImageUrl: tagihan.qrImageUrl,
        rawResponse: { pembuatan: tagihan },
      },
    })
    return {
      orderId,
      amount: pack.price,
      checkoutUrl: tagihan.checkoutUrl,
      qrImageUrl: tagihan.qrImageUrl,
      reference: tagihan.reference,
      expiresAt: tagihan.expiresAt,
    }
  } catch (error) {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } }),
      prisma.boost.update({ where: { id: boost.id }, data: { status: 'failed' } }),
    ])
    // Pesan dari utils/miomipay sudah berbahasa Indonesia dan menyebut sebabnya.
    const detail =
      (error as { data?: { message?: string } })?.data?.message ??
      (error as { statusMessage?: string })?.statusMessage ??
      'Pembayaran gagal disiapkan.'
    throw createError({
      statusCode: (error as { statusCode?: number })?.statusCode ?? 502,
      statusMessage: detail,
      data: { message: detail },
    })
  }
})
