export default defineEventHandler(async event => {
  const user = await requireAuth(event)
  const key = getRouterParam(event, 'key')
  if (!key) throw fail(400, 'Lapak tidak ada.')

  const owned = await requireOwnedBusiness(key, user)

  const parsed = itemInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw fail(422, parsed.error.issues[0]?.message ?? 'Data item tidak valid.')
  }

  return prisma.businessItem.create({
    data: {
      businessId: owned.id,
      name: parsed.data.name,
      // Harga kosong berarti "tanya pemilik", bukan nol rupiah.
      price: parsed.data.price ?? null,
      description: parsed.data.description || null,
      sort: await prisma.businessItem.count({ where: { businessId: owned.id } }),
    },
    select: { id: true, name: true, price: true, description: true },
  })
})
