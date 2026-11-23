import { randomUUID } from 'node:crypto'
import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { requireOwnedBusiness } from '../../utils/business'
import { createSnapToken } from '../../utils/midtrans'
import { fail } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ businessId?: string, packageId?: number }>(event)
  if (!body.businessId || !body.packageId) return fail(422, 'Lapak dan paket wajib dipilih.')
  const business = await requireOwnedBusiness(body.businessId, user)
  const pack = await prisma.boostPackage.findFirst({ where: { id: body.packageId, active: true } })
  if (!pack) return fail(404, 'Paket boost tidak ditemukan.')
  const existing = await prisma.boost.findFirst({ where: { businessId: business.id, status: 'active', endsAt: { gt: new Date() } } })
  if (existing) return fail(409, 'Lapak ini masih memiliki boost aktif.')
  const orderId = `boost-${randomUUID()}`
  const boost = await prisma.boost.create({ data: { businessId: business.id, packageId: pack.id } })
  const payment = await prisma.payment.create({ data: { orderId, boostId: boost.id, amount: pack.price } })
  try {
    const snapToken = await createSnapToken({ orderId, amount: pack.price, customer: user })
    await prisma.payment.update({ where: { id: payment.id }, data: { snapToken } })
    return { orderId, snapToken, amount: pack.price }
  } catch (error) {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } }),
      prisma.boost.update({ where: { id: boost.id }, data: { status: 'failed' } }),
    ])
    throw error
  }
})
