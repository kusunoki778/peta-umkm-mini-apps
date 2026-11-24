import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async event => {
  const user = await requireAuth(event)
  return prisma.boost.findMany({
    where: { business: { ownerId: user.id } },
    orderBy: { createdAt: 'desc' },
    include: { business: { select: { name: true, slug: true } }, package: true, payments: true },
  })
})
