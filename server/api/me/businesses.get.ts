export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const businesses = await prisma.business.findMany({
    where: { ownerId: user.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { name: true, color: true, slug: true } },
      _count: { select: { photos: true, items: true } },
      boosts: {
        where: { status: 'active', endsAt: { gt: new Date() } },
        select: { endsAt: true },
        take: 1,
      },
    },
  })

  return businesses.map((business) => {
    const boost = business.boosts[0] ?? null
    return {
      id: business.id,
      slug: business.slug,
      name: business.name,
      status: business.status,
      category: business.category,
      photoCount: business._count.photos,
      itemCount: business._count.items,
      isBoosted: Boolean(boost),
      boostEndsAt: boost?.endsAt ?? null,
    }
  })
})
