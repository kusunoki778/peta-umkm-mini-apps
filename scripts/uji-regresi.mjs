// Uji regresi penuh terhadap build produksi di port 3111.
import { readFileSync } from 'node:fs'

const BASE = 'http://127.0.0.1:3111'
let pass = 0,
  fail = 0
const gagal = []
function cek(nama, ok, info = '') {
  if (ok) {
    pass++
    console.log(`PASS  ${nama}`)
  } else {
    fail++
    gagal.push(`${nama} :: ${info}`)
    console.log(`FAIL  ${nama} :: ${info}`)
  }
}

let cookie = ''
async function call(path, options = {}) {
  const r = await fetch(BASE + path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...(options.headers ?? {}),
    },
    redirect: 'manual',
  })
  for (const c of r.headers.getSetCookie?.() ?? []) {
    if (c.startsWith('nuxt-auth-session=')) cookie = c.split(';')[0]
  }
  const text = await r.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* bukan JSON */
  }
  return { status: r.status, json, text }
}

// --- konfigurasi pembayaran ---
const cfg = await call('/api/payments/config')
cek('config: penyedia MiomiPay', cfg.json?.penyedia === 'MiomiPay', JSON.stringify(cfg.json))
cek('config: kunci API terbaca', cfg.json?.kunciTerisi === true)
cek('config: alamat API terbaca', cfg.json?.baseUrlTerisi === true)
cek('config: mode sandbox', cfg.json?.modeSandbox === true)
// Kunci API tidak boleh ikut terkirim ke peramban dalam bentuk apa pun.
const kunciAsli = (readFileSync('.env', 'utf8').match(/^MIOMIPAY_SANDBOX_KEY=(.*)$/m)?.[1] ?? '')
  .trim()
  .replace(/^"|"$/g, '')
cek(
  'config: tidak membocorkan kunci',
  Boolean(kunciAsli) && !cfg.text.includes(kunciAsli) && !cfg.text.includes('whsec_'),
  'kunci API atau webhook secret ikut terkirim',
)

// --- publik ---
const daftar = await call('/api/businesses?lat=-6.8915&lng=107.6107&radius=5000')
cek('daftar publik 200', daftar.status === 200)
cek('daftar 5 lapak live', daftar.json?.items?.length === 5, String(daftar.json?.items?.length))
cek(
  'boost urutan pertama',
  daftar.json?.items?.[0]?.isBoosted === true,
  daftar.json?.items?.[0]?.slug,
)
cek('hanya 1 boost', daftar.json?.items?.filter(i => i.isBoosted).length === 1)

const kuliner = await call('/api/businesses?lat=-6.8915&lng=107.6107&radius=5000&category=kuliner')
cek(
  'filter kuliner 3 hasil',
  kuliner.json?.items?.length === 3,
  String(kuliner.json?.items?.length),
)
cek('semua kuliner', kuliner.json?.items?.every(i => i.category.slug === 'kuliner') === true)

const cari = await call('/api/businesses?q=kopi&lat=-6.8915&lng=107.6107&radius=5000')
cek('cari kopi 1 hasil', cari.json?.items?.length === 1, String(cari.json?.items?.length))

for (const path of ['/', '/masuk', '/daftar']) {
  const r = await call(path)
  cek(`SSR ${path} 200`, r.status === 200, String(r.status))
  cek(`SSR ${path} tanpa em dash`, !r.text.includes('\u2014'))
}
const beranda = await call('/')
cek('beranda ada input cari', beranda.text.includes('id="cari-lapak"'))
cek('beranda ada urut', beranda.text.includes('id="urut"'))
cek('beranda ada tombol lokasi', beranda.text.includes('Pakai lokasi saya'))

const detail = await call('/lapak/kafe-kopi-ruang')
cek('detail live 200', detail.status === 200, String(detail.status))
cek('detail badge unggulan', detail.text.includes('Lapak unggulan'))
cek('detail tombol kembali', detail.text.includes('Kembali ke peta'))
cek('detail tanpa em dash', !detail.text.includes('\u2014'))

const pending = await call('/lapak/laundry-kilat')
cek('lapak pending 404', pending.status === 404, String(pending.status))
const asing = await call('/lapak/tidak-ada-lapak')
cek('slug asing 404', asing.status === 404, String(asing.status))

// --- auth & kepemilikan ---
const tanpaSesi = await call('/api/admin/businesses')
cek('admin tanpa sesi 401', tanpaSesi.status === 401, String(tanpaSesi.status))

const login = await call('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'pemilik@lapakpeta.test', password: 'rahasia123' }),
})
cek('login pemilik 200', login.status === 200, String(login.status))

const kelola = await call('/kelola')
cek('halaman kelola 200 setelah login', kelola.status === 200, String(kelola.status))
cek('halaman kelola tanpa em dash', !kelola.text.includes('\u2014'))

const halamanBoost = await call('/kelola/boost/warung-bu-sari')
cek('halaman boost 200', halamanBoost.status === 200, String(halamanBoost.status))
cek('halaman boost ada tombol buat tagihan', halamanBoost.text.includes('Buat tagihan QRIS'))
cek('halaman boost tanpa em dash', !halamanBoost.text.includes('\u2014'))
cek(
  'halaman boost tidak memuat Snap Midtrans',
  !/snap\.js|app\.sandbox\.midtrans/.test(halamanBoost.text),
)

// --- checkout boost sungguhan ---
const paket = await call('/api/boost-packages')
cek(
  'paket boost ada',
  Array.isArray(paket.json) && paket.json.length === 3,
  String(paket.json?.length),
)

const detailWarung = await call('/api/businesses/warung-bu-sari')
const checkout = await call('/api/boosts', {
  method: 'POST',
  body: JSON.stringify({ businessId: detailWarung.json?.id, packageId: paket.json?.[0]?.id }),
})
cek(
  'checkout boost 200',
  checkout.status === 200,
  `${checkout.status} ${checkout.text.slice(0, 200)}`,
)
cek(
  'checkout dapat referensi MiomiPay',
  typeof checkout.json?.reference === 'string' && checkout.json.reference.startsWith('MP-'),
  String(checkout.json?.reference),
)
cek(
  'checkout dapat QRIS gambar',
  typeof checkout.json?.qrImageUrl === 'string' && checkout.json.qrImageUrl.length > 10,
)
cek(
  'checkout dapat orderId',
  typeof checkout.json?.orderId === 'string' && checkout.json.orderId.startsWith('boost-'),
)

// Status tagihan harus bisa ditanyakan pemiliknya sendiri.
const statusBayar = await call(`/api/payments/${checkout.json?.orderId}/status`)
cek(
  'cek status pembayaran 200',
  statusBayar.status === 200,
  `${statusBayar.status} ${statusBayar.text.slice(0, 200)}`,
)
cek('status awal belum lunas', statusBayar.json?.lunas === false, String(statusBayar.json?.lunas))

// lapak yang sudah punya boost aktif harus ditolak
const detailKafe = await call('/api/businesses/kafe-kopi-ruang')
const dobel = await call('/api/boosts', {
  method: 'POST',
  body: JSON.stringify({ businessId: detailKafe.json?.id, packageId: paket.json?.[0]?.id }),
})
cek('boost dobel ditolak 409', dobel.status === 409, `${dobel.status} ${dobel.text.slice(0, 160)}`)

// --- webhook: tanda tangan salah ditolak ---
const webhookSalah = await call('/api/payments/notification', {
  method: 'POST',
  body: JSON.stringify({
    event: 'payment.success',
    data: { reference: 'x', external_id: 'boost-palsu', status: 'PAID' },
  }),
  headers: { 'x-miomipay-signature': 'palsu' },
})
cek('webhook tanda tangan salah 401', webhookSalah.status === 401, String(webhookSalah.status))

// Tanpa header tanda tangan sama sekali juga harus ditolak.
const webhookKosong = await call('/api/payments/notification', {
  method: 'POST',
  body: JSON.stringify({ data: { external_id: 'boost-palsu', status: 'PAID' } }),
})
cek('webhook tanpa tanda tangan 401', webhookKosong.status === 401, String(webhookKosong.status))

// --- admin dengan sesi pemilik ditolak ---
const adminSebagaiPemilik = await call('/api/admin/businesses')
cek(
  'admin ditolak untuk pemilik 403',
  adminSebagaiPemilik.status === 403,
  String(adminSebagaiPemilik.status),
)

// --- logout ---
const logout = await call('/api/auth/logout', { method: 'POST' })
cek('logout 200', logout.status === 200, String(logout.status))
const setelahLogout = await call('/api/auth/me')
cek(
  'setelah logout tanpa sesi',
  setelahLogout.status === 204 || setelahLogout.json === null,
  String(setelahLogout.status),
)

console.log(`\nHASIL: ${pass} PASS, ${fail} FAIL`)
if (fail) {
  console.log('GAGAL:')
  gagal.forEach(g => console.log(' - ' + g))
}
process.exit(fail ? 1 : 0)
