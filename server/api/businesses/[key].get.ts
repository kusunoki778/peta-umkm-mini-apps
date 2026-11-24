/**
 * Detail lapak, bisa diakses lewat slug (untuk halaman publik) atau id
 * (untuk halaman kelola). Memakai satu nama parameter "key" karena router
 * Nitro (radix3) gagal mencocokkan rute bersarang bila dua nama parameter
 * berbeda, misalnya :id dan :slug, menempati posisi segmen yang sama.
 */
export default defineEventHandler(async event => {
  const key = getRouterParam(event, 'key')
  if (!key) throw fail(400, 'Lapak tidak ada.')

  // Halaman detail bersifat publik. Sesi hanya dipakai untuk tahu apakah
  // penonton adalah pemilik atau admin, sehingga lapak yang belum tayang
  // tetap bisa dilihat oleh yang berhak.
  const session = await getUserSession(event)
  const user = session.user ?? null

  const business = await prisma.business.findFirst({
    where: { OR: [{ slug: key }, { id: key }], deletedAt: null },
    include: {
      category: true,
      photos: { orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }] },
      items: { orderBy: [{ sort: 'asc' }] },
      hours: { orderBy: { day: 'asc' } },
      boosts: {
        where: { status: 'active', endsAt: { gt: new Date() } },
        orderBy: { endsAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!business) throw fail(404, 'Lapak tidak ditemukan.')

  const isOwner = user?.id === business.ownerId
  const visible = business.status === 'live' || isOwner || user?.role === 'admin'
  if (!visible) throw fail(404, 'Lapak tidak ditemukan atau belum tayang.')

  const activeBoost = business.boosts[0] ?? null
  const { boosts, ...rest } = business

  return {
    ...rest,
    isOwner,
    isBoosted: Boolean(activeBoost),
    boostEndsAt: activeBoost?.endsAt ?? null,
  }
})
