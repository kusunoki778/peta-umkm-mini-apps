import { prisma } from '../../utils/prisma'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  return prisma.category.findMany({
    orderBy: { sort: 'asc' },
    include: { _count: { select: { businesses: true } } },
  })
})
