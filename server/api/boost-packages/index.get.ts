import { prisma } from '../../utils/prisma'

export default defineEventHandler(() => prisma.boostPackage.findMany({
  where: { active: true },
  orderBy: { sort: 'asc' },
  select: { id: true, name: true, durationDays: true, price: true, features: true },
}))
