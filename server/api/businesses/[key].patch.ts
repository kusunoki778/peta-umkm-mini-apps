export default defineEventHandler(async event => {
  const user = await requireAuth(event)
  const key = getRouterParam(event, 'key')
  if (!key) throw fail(400, 'Lapak tidak ada.')

  const owned = await requireOwnedBusiness(key, user)

  const parsed = businessInputSchema.partial().safeParse(await readBody(event))
  if (!parsed.success) {
    throw fail(422, parsed.error.issues[0]?.message ?? 'Data lapak tidak valid.')
  }
  const input = parsed.data

  if (input.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    })
    if (!category) throw fail(422, 'Kategori yang dipilih tidak ada.')
  }

  return prisma.business.update({
    where: { id: owned.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.whatsapp !== undefined ? { whatsapp: input.whatsapp || null } : {}),
      ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
      ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
    },
    select: { id: true, slug: true, name: true, status: true },
  })
})
