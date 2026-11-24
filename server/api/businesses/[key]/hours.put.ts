import { z } from 'zod'

const bodySchema = z.object({
  hours: z.array(hourInputSchema).max(7, 'Maksimal 7 baris jam buka.'),
})

export default defineEventHandler(async event => {
  const user = await requireAuth(event)
  const key = getRouterParam(event, 'key')
  if (!key) throw fail(400, 'Lapak tidak ada.')

  const owned = await requireOwnedBusiness(key, user)

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw fail(422, parsed.error.issues[0]?.message ?? 'Data jam buka tidak valid.')
  }

  const uniqueDays = new Set(parsed.data.hours.map(hour => hour.day))
  if (uniqueDays.size !== parsed.data.hours.length) {
    throw fail(422, 'Ada hari yang tertulis dua kali.')
  }

  await prisma.$transaction([
    prisma.openingHour.deleteMany({ where: { businessId: owned.id } }),
    prisma.openingHour.createMany({
      data: parsed.data.hours.map(hour => ({
        businessId: owned.id,
        day: hour.day,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
        closed: hour.closed,
      })),
    }),
  ])

  return prisma.openingHour.findMany({
    where: { businessId: owned.id },
    orderBy: { day: 'asc' },
  })
})
