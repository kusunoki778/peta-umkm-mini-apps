import { z } from 'zod'
import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'
import { fail } from '../../../utils/errors'

const input = z.object({ status: z.enum(['live', 'rejected', 'inactive']), reason: z.string().trim().max(500).nullable().optional() })

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const parsed = input.safeParse(await readBody(event))
  if (!parsed.success) return fail(422, 'Status moderasi tidak valid.', parsed.error.flatten())
  const business = await prisma.business.findUnique({ where: { id } })
  if (!business) return fail(404, 'Lapak tidak ditemukan.')
  return prisma.business.update({ where: { id }, data: { status: parsed.data.status } })
})
