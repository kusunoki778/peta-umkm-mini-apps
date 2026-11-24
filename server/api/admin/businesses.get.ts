import { prisma } from '../../utils/prisma'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  return prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true, owner: { select: { name: true, email: true } } },
  })
})
