// Bersihkan data uji yang tertinggal: foto, lapak pembanding, dan berkas upload.
// Butuh server produksi berjalan di port 3111.
import { readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

const BASE = 'http://127.0.0.1:3111'
let cookie = ''

async function call(path, options = {}) {
  const r = await fetch(BASE + path, {
    ...options,
    headers: {
      ...(typeof options.body === 'string' ? { 'content-type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
      ...(options.headers ?? {}),
    },
    redirect: 'manual',
  })
  for (const c of r.headers.getSetCookie?.() ?? []) {
    if (c.startsWith('nuxt-auth-session=')) cookie = c.split(';')[0]
  }
  const teks = await r.text()
  let json = null
  try {
    json = JSON.parse(teks)
  } catch {
    // bukan JSON
  }
  return { status: r.status, json, teks }
}

async function login(email) {
  const r = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'rahasia123' }),
    redirect: 'manual',
  })
  for (const c of r.headers.getSetCookie?.() ?? []) {
    if (c.startsWith('nuxt-auth-session=')) cookie = c.split(';')[0]
  }
  return r.status
}

async function bersihkanAkun(email) {
  cookie = ''
  await login(email)
  const daftar = await call('/api/me/businesses')
  for (const item of daftar.json ?? []) {
    const detail = await call(`/api/businesses/${item.slug}`)
    for (const foto of detail.json?.photos ?? []) {
      await call(`/api/photos/${foto.id}`, { method: 'DELETE' })
    }
    // Hapus lapak buatan uji, bukan lapak seed.
    if (/uji|banding|pembanding/i.test(item.slug)) {
      const hapus = await call(`/api/businesses/${item.id}`, { method: 'DELETE' })
      console.log(`hapus lapak ${item.slug}: ${hapus.status}`)
    }
  }
}

await bersihkanAkun('pemilik@lapakpeta.test')
await bersihkanAkun('admin@lapakpeta.test')

const folder = join(process.cwd(), 'public', 'uploads')
let berkas = 0
try {
  for (const nama of await readdir(folder)) {
    if (nama === '.gitkeep') continue
    await rm(join(folder, nama), { force: true })
    berkas++
  }
} catch {
  // folder belum ada
}
console.log(`berkas upload dihapus: ${berkas}`)
