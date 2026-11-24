export default defineEventHandler(async event => {
  const user = await requireAuth(event)
  const parsed = businessInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw fail(422, parsed.error.issues[0]?.message ?? 'Data lapak tidak valid.')
  }

  const input = parsed.data
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  })
  if (!category) throw fail(422, 'Kategori yang dipilih tidak ada.')

  const slug = await uniqueSlug(slugify(input.name))

  const business = await prisma.business.create({
    data: {
      ownerId: user.id,
      categoryId: input.categoryId,
      name: input.name,
      slug,
      description: input.description || null,
      address: input.address,
      phone: input.phone || null,
      whatsapp: input.whatsapp || null,
      latitude: input.latitude,
      longitude: input.longitude,
      // Lapak baru tidak langsung tayang; admin memverifikasi dulu.
      status: 'pending',
    },
    select: { id: true, slug: true, name: true, status: true },
  })

  return business
})
