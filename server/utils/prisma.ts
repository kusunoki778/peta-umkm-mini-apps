import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../app/generated/prisma/client'

function createClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL belum diisi. Salin .env.example menjadi .env lalu isi koneksi PostgreSQL.',
    )
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Satu koneksi per proses. Di dev, Nuxt memuat ulang modul server tiap kali
// file berubah, jadi simpan di globalThis supaya pool tidak menumpuk.
export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
