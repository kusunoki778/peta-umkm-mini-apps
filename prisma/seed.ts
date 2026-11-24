// Data contoh untuk pengembangan lokal. Nama lapak, alamat, dan harga di sini
// fiktif: dipakai supaya peta, filter, dan alur boost bisa dicoba sebelum ada
// data nyata. Akun contoh juga hanya untuk dev, jangan dipakai di produksi.
import 'dotenv/config'
import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client.ts'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL belum diisi. Salin .env.example menjadi .env dulu.')
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
const hasher = new Hash(new Scrypt())

const CONTOH_PASSWORD = 'rahasia123'

const CATEGORIES = [
  { slug: 'kuliner', name: 'Kuliner', color: '#E4572E', icon: 'utensils', sort: 1 },
  { slug: 'kos', name: 'Kos', color: '#2E6BB0', icon: 'bed', sort: 2 },
  { slug: 'bengkel', name: 'Bengkel', color: '#5A6472', icon: 'wrench', sort: 3 },
  { slug: 'jasa-lain', name: 'Jasa lain', color: '#7A4FB5', icon: 'sparkles', sort: 4 },
]

const PACKAGES = [
  {
    name: 'Hemat',
    durationDays: 7,
    price: 15000,
    sort: 1,
    features: ['Penanda emas di peta', 'Naik ke atas daftar terdekat'],
  },
  {
    name: 'Standar',
    durationDays: 30,
    price: 25000,
    sort: 2,
    features: ['Penanda emas di peta', 'Naik ke atas daftar terdekat', 'Tampil di sorotan beranda'],
  },
  {
    name: 'Pro',
    durationDays: 90,
    price: 60000,
    sort: 3,
    features: [
      'Penanda emas di peta',
      'Naik ke atas daftar terdekat',
      'Tampil di sorotan beranda',
      'Riwayat tayang 90 hari',
    ],
  },
]

type BizSeed = {
  slug: string
  name: string
  category: string
  description: string
  address: string
  phone?: string
  latitude: number
  longitude: number
  status: 'live' | 'pending' | 'rejected' | 'inactive'
  hours: { open: string; close: string; closedDays?: number[] }
  items: { name: string; price?: number; description?: string }[]
  boostDays?: number
  photoUrl?: string
}

// Koordinat tersebar di sekitar kampus (radius sekitar 1 km).
const BUSINESSES: BizSeed[] = [
  {
    slug: 'warung-bu-sari',
    name: 'Warung Bu Sari',
    category: 'kuliner',
    description: 'Masakan rumahan harian dengan nasi campur dan lauk gorengan.',
    address: 'Jl. Ganesha No. 12, dekat gerbang kampus',
    phone: '081200000001',
    latitude: -6.8918,
    longitude: 107.6123,
    status: 'live',
    hours: { open: '07:00', close: '21:00' },
    items: [
      { name: 'Nasi campur', price: 15000 },
      { name: 'Ayam goreng', price: 12000 },
      { name: 'Es teh manis', price: 5000 },
    ],
    photoUrl:
      'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=960&q=80',
  },
  {
    slug: 'kos-putri-melati',
    name: 'Kos Putri Melati',
    category: 'kos',
    description: 'Kos putri 12 kamar, ada dapur bersama dan parkir motor.',
    address: 'Jl. Cisitu Lama No. 8',
    phone: '081200000002',
    latitude: -6.893,
    longitude: 107.609,
    status: 'live',
    hours: { open: '07:00', close: '20:00', closedDays: [0] },
    items: [
      { name: 'Kamar mandi dalam', price: 1400000, description: 'Per bulan, termasuk listrik.' },
      { name: 'Kamar mandi luar', price: 900000, description: 'Per bulan, termasuk listrik.' },
    ],
    photoUrl:
      'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=960&q=80',
  },
  {
    slug: 'bengkel-jaya-motor',
    name: 'Bengkel Jaya Motor',
    category: 'bengkel',
    description: 'Servis motor harian, ganti oli, dan tambal ban.',
    address: 'Jl. Sangkuriang No. 27',
    phone: '081200000003',
    latitude: -6.889,
    longitude: 107.615,
    status: 'live',
    hours: { open: '08:00', close: '18:00', closedDays: [0] },
    items: [
      { name: 'Servis rutin', price: 60000 },
      { name: 'Ganti oli', price: 45000, description: 'Belum termasuk oli.' },
      { name: 'Tambal ban', price: 20000 },
    ],
    photoUrl:
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=960&q=80',
  },
  {
    slug: 'warteg-bahari',
    name: 'Warteg Bahari',
    category: 'kuliner',
    description: 'Warteg 24 jam, cocok untuk makan malam setelah kelas.',
    address: 'Jl. Dipatiukur No. 45',
    latitude: -6.8875,
    longitude: 107.608,
    status: 'live',
    hours: { open: '00:00', close: '23:59' },
    items: [
      { name: 'Nasi telur', price: 9000 },
      { name: 'Nasi ayam', price: 14000 },
    ],
    photoUrl:
      'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=960&q=80',
  },
  {
    slug: 'kafe-kopi-ruang',
    name: 'Kafe Kopi Ruang',
    category: 'kuliner',
    description: 'Kafe kecil dengan wifi kencang dan colokan di tiap meja.',
    address: 'Jl. Gelap Nyawang No. 3',
    phone: '081200000004',
    latitude: -6.8925,
    longitude: 107.616,
    status: 'live',
    hours: { open: '09:00', close: '22:00' },
    items: [
      { name: 'Kopi susu', price: 22000 },
      { name: 'Americano', price: 18000 },
      { name: 'Roti bakar', price: 15000 },
    ],
    photoUrl:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=960&q=80',
    boostDays: 30,
  },
  {
    slug: 'laundry-kilat',
    name: 'Laundry Kilat',
    category: 'jasa-lain',
    description: 'Cuci kering setrika, selesai dalam sehari.',
    address: 'Jl. Cisitu Indah No. 5',
    latitude: -6.8955,
    longitude: 107.6135,
    status: 'pending',
    hours: { open: '07:00', close: '19:00' },
    items: [
      { name: 'Cuci setrika per kg', price: 7000 },
      { name: 'Ekspres sehari jadi', price: 12000, description: 'Per kg.' },
    ],
  },
]

async function upsertUser(data: { email: string; name: string; role: 'owner' | 'admin' }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { name: data.name, role: data.role },
    })
  }
  return prisma.user.create({
    data: {
      ...data,
      passwordHash: await hasher.make(CONTOH_PASSWORD),
    },
  })
}

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        color: category.color,
        icon: category.icon,
        sort: category.sort,
      },
      create: category,
    })
  }

  for (const pack of PACKAGES) {
    const existing = await prisma.boostPackage.findFirst({ where: { name: pack.name } })
    if (existing) {
      await prisma.boostPackage.update({ where: { id: existing.id }, data: pack })
    } else {
      await prisma.boostPackage.create({ data: pack })
    }
  }

  await upsertUser({ email: 'admin@lapakpeta.test', name: 'Admin Lapak Peta', role: 'admin' })
  const owner = await upsertUser({
    email: 'pemilik@lapakpeta.test',
    name: 'Pemilik Contoh',
    role: 'owner',
  })

  const categories = await prisma.category.findMany()
  const categoryBySlug = new Map(categories.map(c => [c.slug, c.id]))
  const standardPackage = await prisma.boostPackage.findFirst({ where: { name: 'Standar' } })

  for (const seed of BUSINESSES) {
    const categoryId = categoryBySlug.get(seed.category)
    if (!categoryId) throw new Error(`Kategori ${seed.category} tidak ditemukan.`)

    const business = await prisma.business.upsert({
      where: { slug: seed.slug },
      update: {
        name: seed.name,
        description: seed.description,
        address: seed.address,
        phone: seed.phone ?? null,
        latitude: seed.latitude,
        longitude: seed.longitude,
        status: seed.status,
        categoryId,
      },
      create: {
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        address: seed.address,
        phone: seed.phone ?? null,
        latitude: seed.latitude,
        longitude: seed.longitude,
        status: seed.status,
        categoryId,
        ownerId: owner.id,
      },
    })

    await prisma.businessItem.deleteMany({ where: { businessId: business.id } })
    await prisma.businessItem.createMany({
      data: seed.items.map((item, index) => ({
        businessId: business.id,
        name: item.name,
        price: item.price ?? null,
        description: item.description ?? null,
        sort: index,
      })),
    })

    await prisma.openingHour.deleteMany({ where: { businessId: business.id } })
    await prisma.openingHour.createMany({
      data: [0, 1, 2, 3, 4, 5, 6].map(day => ({
        businessId: business.id,
        day,
        openTime: seed.hours.open,
        closeTime: seed.hours.close,
        closed: seed.hours.closedDays?.includes(day) ?? false,
      })),
    })

    if (seed.photoUrl) {
      const photo = await prisma.businessPhoto.findFirst({ where: { businessId: business.id } })
      if (!photo) {
        await prisma.businessPhoto.create({
          data: {
            businessId: business.id,
            url: seed.photoUrl,
            alt: `Foto ${seed.name}`,
          },
        })
      }
    }

    if (seed.boostDays && standardPackage) {
      const active = await prisma.boost.findFirst({
        where: { businessId: business.id, status: 'active' },
      })
      if (!active) {
        const startsAt = new Date()
        const endsAt = new Date(startsAt.getTime() + seed.boostDays * 24 * 60 * 60 * 1000)
        const boost = await prisma.boost.create({
          data: {
            businessId: business.id,
            packageId: standardPackage.id,
            status: 'active',
            startsAt,
            endsAt,
          },
        })
        await prisma.payment.create({
          data: {
            orderId: `seed-${boost.id}`,
            boostId: boost.id,
            amount: standardPackage.price,
            status: 'settled',
            method: 'seed',
            paidAt: startsAt,
          },
        })
      }
    }
  }

  console.log('Seed selesai.')
  console.log(`Akun admin: admin@lapakpeta.test / ${CONTOH_PASSWORD}`)
  console.log(`Akun pemilik: pemilik@lapakpeta.test / ${CONTOH_PASSWORD}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async error => {
    console.error(error)
    await prisma.$disconnect()
    process.exitCode = 1
  })
