import { simpanFoto, MAX_PHOTOS_PER_BUSINESS } from '../../../utils/foto'

/**
 * Unggah satu foto lapak. Badan request berupa multipart dengan field `foto`
 * dan `alt` (opsional). Gambar diperkecil di server supaya peramban tidak perlu
 * mengirim berkas 5 MB.
 */
export default defineEventHandler(async event => {
  const user = await requireAuth(event)
  const key = getRouterParam(event, 'key')
  if (!key) throw fail(400, 'Lapak tidak ada.')

  const owned = await requireOwnedBusiness(key, user)

  const jumlah = await prisma.businessPhoto.count({ where: { businessId: owned.id } })
  if (jumlah >= MAX_PHOTOS_PER_BUSINESS) {
    throw fail(422, `Maksimal ${MAX_PHOTOS_PER_BUSINESS} foto per lapak.`)
  }

  const parts = await readMultipartFormData(event)
  const berkas = parts?.find(part => part.name === 'foto' && part.data?.length)
  if (!berkas) throw fail(422, 'Pilih foto yang ingin diunggah.')

  const altPart = parts?.find(part => part.name === 'alt')
  const alt = altPart ? Buffer.from(altPart.data).toString('utf8') : null

  const hasil = await simpanFoto(berkas.data, alt)

  // Foto baru ditaruh paling akhir supaya urutan lama tetap.
  const terakhir = await prisma.businessPhoto.findFirst({
    where: { businessId: owned.id },
    orderBy: { sort: 'desc' },
    select: { sort: true },
  })

  const foto = await prisma.businessPhoto.create({
    data: {
      businessId: owned.id,
      url: hasil.url,
      alt: hasil.alt,
      sort: (terakhir?.sort ?? -1) + 1,
    },
    select: { id: true, url: true, alt: true, sort: true },
  })

  return { ...foto, width: hasil.width, height: hasil.height }
})
