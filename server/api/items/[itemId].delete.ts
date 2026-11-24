export default defineEventHandler(async event => {
  const user = await requireAuth(event)
  const itemId = getRouterParam(event, 'itemId')
  if (!itemId) throw fail(400, 'ID item tidak ada.')

  const item = await prisma.businessItem.findUnique({
    where: { id: itemId },
    select: { id: true, businessId: true },
  })
  if (!item) throw fail(404, 'Item tidak ditemukan.')

  await requireOwnedBusiness(item.businessId, user)
  await prisma.businessItem.delete({ where: { id: itemId } })

  return { ok: true }
})
