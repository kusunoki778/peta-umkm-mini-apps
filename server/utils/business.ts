import { z } from 'zod'

/** Ubah nama jadi slug yang aman untuk URL. */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Tambahkan akhiran angka sampai slug belum dipakai lapak lain. */
export async function uniqueSlug(base: string, exceptId?: string) {
  const root = base || 'lapak'
  let candidate = root
  let counter = 1

  for (;;) {
    const clash = await prisma.business.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!clash || clash.id === exceptId) return candidate
    counter += 1
    candidate = `${root}-${counter}`
  }
}

export const businessInputSchema = z.object({
  name: z.string().trim().min(2, 'Nama lapak minimal 2 karakter.').max(80, 'Nama lapak maksimal 80 karakter.'),
  categoryId: z.coerce.number().int().positive('Pilih kategori lapak.'),
  description: z.string().trim().max(600, 'Deskripsi maksimal 600 karakter.').optional(),
  address: z.string().trim().min(5, 'Alamat minimal 5 karakter.').max(200, 'Alamat maksimal 200 karakter.'),
  phone: z.string().trim().max(20, 'Nomor telepon maksimal 20 karakter.').optional(),
  whatsapp: z.string().trim().max(20, 'Nomor WhatsApp maksimal 20 karakter.').optional(),
  latitude: z.coerce.number().min(-90, 'Lintang tidak valid.').max(90, 'Lintang tidak valid.'),
  longitude: z.coerce.number().min(-180, 'Bujur tidak valid.').max(180, 'Bujur tidak valid.'),
})

export const itemInputSchema = z.object({
  name: z.string().trim().min(1, 'Nama item wajib diisi.').max(80, 'Nama item maksimal 80 karakter.'),
  price: z.coerce.number().int().min(0, 'Harga tidak boleh negatif.').optional().nullable(),
  description: z.string().trim().max(200, 'Keterangan maksimal 200 karakter.').optional().nullable(),
})

export const hourInputSchema = z.object({
  day: z.coerce.number().int().min(0).max(6),
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam buka harus HH:mm.'),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam tutup harus HH:mm.'),
  closed: z.coerce.boolean().default(false),
})

export const HOURS_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

/** Cari lapak milik pengguna lewat id atau slug, atau 404/403 yang jelas. */
export async function requireOwnedBusiness(key: string, user: { id: string }) {
  const business = await prisma.business.findFirst({
    where: { OR: [{ id: key }, { slug: key }], deletedAt: null },
    select: { id: true, ownerId: true, slug: true, name: true, status: true },
  })
  if (!business) throw fail(404, 'Lapak tidak ditemukan.')
  // Admin punya jalur moderasi sendiri, bukan jalur CRUD pemilik. Jadi di sini
  // kepemilikan tetap wajib, termasuk untuk admin.
  if (business.ownerId !== user.id) {
    throw fail(403, 'Lapak ini milik akun lain.')
  }
  return business
}
