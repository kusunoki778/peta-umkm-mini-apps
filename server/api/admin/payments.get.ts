import { prisma } from '../../utils/prisma'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { boost: { include: { business: { select: { name: true, slug: true } }, package: true } } },
  })
})
