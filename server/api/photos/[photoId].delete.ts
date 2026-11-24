import { hapusFoto } from '../../utils/foto'

/** Hapus satu foto lapak, termasuk berkas fisiknya. */
export default defineEventHandler(async event => {
  const user = await requireAuth(event)
  const photoId = getRouterParam(event, 'photoId')
  if (!photoId) throw fail(400, 'Foto tidak ada.')

  const foto = await prisma.businessPhoto.findUnique({
    where: { id: photoId },
    select: { id: true, url: true, business: { select: { id: true, ownerId: true } } },
  })
  if (!foto) throw fail(404, 'Foto tidak ditemukan.')
  if (foto.business.ownerId !== user.id) throw fail(403, 'Foto ini milik akun lain.')

  await prisma.businessPhoto.delete({ where: { id: foto.id } })
  await hapusFoto(foto.url)

  return { ok: true }
})
