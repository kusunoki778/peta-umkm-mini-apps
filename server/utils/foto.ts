import { randomUUID } from 'node:crypto'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

/**
 * Foto lapak disimpan di disk lokal (folder `public/uploads`), bukan di objek
 * storage. Alasannya proyek ini portofolio yang harus bisa dijalankan tanpa
 * akun layanan pihak ketiga. Konsekuensinya: folder `public/uploads` tidak
 * ikut Git, dan deployment yang memakai filesystem read-only perlu diganti ke
 * S3 atau sejenisnya.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const MAX_PHOTOS_PER_BUSINESS = 6

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

// Tiga ukuran: kartu daftar, halaman detail, dan cadangan untuk layar besar.
const VARIANTS = [
  { suffix: 'kartu', width: 480 },
  { suffix: 'detail', width: 960 },
  { suffix: 'besar', width: 1440 },
] as const

export function uploadDir() {
  return join(process.cwd(), 'public', 'uploads')
}

/** Nama berkas yang aman: huruf, angka, tanda hubung saja. */
function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40)
}

export interface HasilUnggah {
  url: string
  alt: string | null
  width: number
  height: number
}

/**
 * Validasi jenis berkas dari isi, bukan dari nama atau header yang dikirim
 * klien, lalu kecilkan ukurannya dan simpan ke disk.
 */
export async function simpanFoto(input: Uint8Array, alt: string | null): Promise<HasilUnggah> {
  if (input.byteLength === 0) throw fail(422, 'Berkas foto kosong.')
  if (input.byteLength > MAX_UPLOAD_BYTES) {
    throw fail(422, 'Ukuran foto maksimal 5 MB.')
  }

  const periksa = sharp(input)
  let metadata
  try {
    metadata = await periksa.metadata()
  } catch {
    // sharp melempar error untuk berkas yang isinya bukan gambar, walaupun
    // namanya berakhiran .jpg. Itu masukan pengguna, bukan kegagalan server.
    throw fail(422, 'Berkas itu tidak bisa dibaca sebagai gambar. Coba foto lain.')
  }
  // Format dari sharp sudah berupa 'jpeg', 'png', atau 'webp'. Selain itu ditolak.
  if (!metadata.format || !ALLOWED_MIME.has(`image/${metadata.format}`)) {
    throw fail(422, 'Format foto harus JPG, PNG, atau WebP.')
  }

  const dasar = safeName(`${Date.now()}-${randomUUID()}`)
  const folder = uploadDir()
  await mkdir(folder, { recursive: true })

  let urlKartu = ''
  let lebar = 0
  let tinggi = 0

  for (const varian of VARIANTS) {
    const nama = `${dasar}-${varian.suffix}.webp`
    // withoutEnlargement menjaga foto kecil tidak dipaksa membesar dan jadi kabur.
    const hasil = await sharp(input)
      .rotate()
      .resize({ width: varian.width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true })
      .catch(() => {
        throw fail(422, 'Gambar gagal diperkecil. Berkasnya mungkin rusak.')
      })

    await writeFile(join(folder, nama), hasil.data)

    if (varian.suffix === 'kartu') {
      urlKartu = `/uploads/${nama}`
      lebar = hasil.info.width
      tinggi = hasil.info.height
    }
    if (varian.suffix === 'detail') {
      lebar = hasil.info.width
      tinggi = hasil.info.height
    }
  }

  return {
    url: urlKartu,
    alt: alt?.trim() ? alt.trim().slice(0, 160) : null,
    width: lebar,
    height: tinggi,
  }
}

/** Hapus ketiga berkas varian milik satu foto. */
export async function hapusFoto(url: string) {
  if (!url.startsWith('/uploads/')) return
  const dasar = url.replace('/uploads/', '').replace(/-kartu\.webp$/, '')
  const folder = uploadDir()
  await Promise.all(
    VARIANTS.map(async varian => {
      try {
        await unlink(join(folder, `${dasar}-${varian.suffix}.webp`))
      } catch {
        // Berkas mungkin sudah tidak ada; mengabaikan tidak merusak data.
      }
    }),
  )
}
