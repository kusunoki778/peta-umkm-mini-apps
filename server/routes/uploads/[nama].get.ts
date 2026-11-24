import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Menyajikan foto lapak dari `public/uploads`.
 *
 * Folder `public` hanya disalin ke `.output/public` saat build, sehingga foto
 * yang diunggah setelah build tidak akan tersaji oleh penyaji statis Nitro.
 * Rute ini membaca langsung dari disk supaya unggahan tetap tampil tanpa perlu
 * build ulang, baik saat dev maupun produksi.
 */
export default defineEventHandler(async event => {
  const nama = getRouterParam(event, 'nama')
  // Tolak nama berkas yang mencoba keluar dari folder uploads.
  if (!nama || !/^[a-zA-Z0-9-]+\.webp$/.test(nama)) {
    throw fail(404, 'Foto tidak ditemukan.')
  }

  const lokasi = join(process.cwd(), 'public', 'uploads', nama)
  const info = await stat(lokasi).catch(() => null)
  if (!info?.isFile()) throw fail(404, 'Foto tidak ditemukan.')

  setHeader(event, 'content-type', 'image/webp')
  setHeader(event, 'content-length', info.size)
  // Nama berkas memuat id acak dan tidak pernah dipakai ulang, jadi aman
  // disimpan lama di cache peramban.
  setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')

  return sendStream(event, createReadStream(lokasi))
})
