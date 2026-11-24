export default defineEventHandler(async event => {
  const user = await requireAuth(event)
  const key = getRouterParam(event, 'key')
  if (!key) throw fail(400, 'Lapak tidak ada.')

  const owned = await requireOwnedBusiness(key, user)

  // Hapus lunak: data tetap tersimpan, hanya disembunyikan dari daftar dan peta.
  await prisma.business.update({
    where: { id: owned.id },
    data: { deletedAt: new Date(), status: 'inactive' },
  })

  return { ok: true }
})
