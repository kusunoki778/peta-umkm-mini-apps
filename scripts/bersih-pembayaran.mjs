// Bersihkan sisa data uji pembayaran: lapak buatan uji, boost, dan tagihannya.
// Butuh server produksi berjalan di port 3111.
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
  cookie = ''
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

for (const email of ['pemilik@lapakpeta.test', 'admin@lapakpeta.test']) {
  await login(email)
  const daftar = await call('/api/me/businesses')
  for (const item of daftar.json ?? []) {
    // Hanya lapak buatan uji, bukan lapak seed.
    if (!/uji|banding|pembanding|bayar/i.test(item.slug)) continue
    const hapus = await call(`/api/businesses/${item.id}`, { method: 'DELETE' })
    console.log(`hapus lapak ${item.slug}: ${hapus.status}`)
  }
}

// Pastikan lapak seed tidak lagi punya boost sisa uji.
await login('pemilik@lapakpeta.test')
const seed = ['warung-bu-sari', 'kafe-kopi-ruang', 'kos-putri-melati', 'bengkel-jaya-motor']
for (const slug of seed) {
  const detail = await call(`/api/businesses/${slug}`)
  console.log(`${slug}: boost=${detail.json?.isBoosted === true ? 'aktif' : 'tidak'}`)
}
