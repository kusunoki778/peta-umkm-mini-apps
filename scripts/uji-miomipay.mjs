// Uji pembayaran MiomiPay ujung ke ujung terhadap build produksi.
// Alurnya sama dengan yang dijalani pemilik lapak: buat tagihan, bayar lewat
// simulator sandbox MiomiPay, lalu pastikan boost benar-benar aktif.
//
// Butuh server berjalan di port 3111 dan .env berisi MIOMIPAY_SANDBOX_KEY.
import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'

const BASE = 'http://127.0.0.1:3111'
const SIMULATOR = 'https://pg.miomidev.com/sandbox/simulator'

function bacaEnv(nama) {
  const isi = readFileSync('.env', 'utf8')
  const baris = isi.match(new RegExp(`^${nama}=(.*)$`, 'm'))?.[1] ?? ''
  return baris.trim().replace(/^"|"$/g, '')
}

const webhookSecret = bacaEnv('MIOMIPAY_WEBHOOK_SECRET')
if (!webhookSecret) {
  console.log('GAGAL: MIOMIPAY_WEBHOOK_SECRET tidak ada di .env')
  process.exit(1)
}

let pass = 0
let fail = 0
function cek(nama, ok, info = '') {
  if (ok) {
    pass++
    console.log(`PASS  ${nama}`)
  } else {
    fail++
    console.log(`FAIL  ${nama} :: ${info}`)
  }
}

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

async function login(email, password = 'rahasia123') {
  cookie = ''
  const r = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
    redirect: 'manual',
  })
  for (const c of r.headers.getSetCookie?.() ?? []) {
    if (c.startsWith('nuxt-auth-session=')) cookie = c.split(';')[0]
  }
  return r.status
}

/** Bayar tagihan lewat simulator sandbox MiomiPay, seperti menekan tombol di sana. */
async function lunasiDiSimulator(snapToken) {
  const html = await fetch(SIMULATOR).then(r => r.text())
  const csrf = html.match(/X-CSRF-TOKEN':\s*'([^']+)'/)?.[1]
  if (!csrf) throw new Error('token CSRF simulator tidak ditemukan')
  const r = await fetch(SIMULATOR, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-CSRF-TOKEN': csrf,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({ query: snapToken, action: 'paid' }),
  })
  return { status: r.status, json: await r.json() }
}

// Lapak uji dipakai supaya warung seed yang punya boost tidak terganggu.
cek('login pemilik', (await login('pemilik@lapakpeta.test')) === 200)

const kategori = await call('/api/categories')
const lapak = await call('/api/businesses', {
  method: 'POST',
  body: JSON.stringify({
    name: `Lapak Uji Bayar ${Date.now()}`,
    categoryId: kategori.json?.[0]?.id,
    address: 'Jl. Uji Pembayaran No. 1',
    latitude: -6.8915,
    longitude: 107.6107,
  }),
})
const idLapak = lapak.json?.id
cek('lapak uji dibuat', Boolean(idLapak), `${lapak.status} ${lapak.teks.slice(0, 160)}`)

const paket = await call('/api/boost-packages')
const paketUji = paket.json?.[0]

// --- buat tagihan ---
const checkout = await call('/api/boosts', {
  method: 'POST',
  body: JSON.stringify({ businessId: idLapak, packageId: paketUji?.id }),
})
cek(
  'buat tagihan 200',
  checkout.status === 200,
  `${checkout.status} ${checkout.teks.slice(0, 200)}`,
)
cek(
  'referensi berawalan MP-',
  checkout.json?.reference?.startsWith('MP-'),
  String(checkout.json?.reference),
)
cek(
  'ada URL gambar QRIS',
  checkout.json?.qrImageUrl?.startsWith('https://'),
  String(checkout.json?.qrImageUrl),
)
cek(
  'ada URL halaman checkout',
  checkout.json?.checkoutUrl?.startsWith('https://'),
  String(checkout.json?.checkoutUrl),
)
cek(
  'nominal sesuai paket',
  checkout.json?.amount === paketUji?.price,
  String(checkout.json?.amount),
)

const orderId = checkout.json?.orderId

// --- status sebelum dibayar ---
const sebelum = await call(`/api/payments/${orderId}/status`)
cek('cek status sebelum bayar 200', sebelum.status === 200, String(sebelum.status))
cek('sebelum bayar belum lunas', sebelum.json?.lunas === false, String(sebelum.json?.lunas))

// --- gambar QRIS benar-benar bisa dibuka dan berupa gambar ---
const qr = await fetch(checkout.json?.qrImageUrl ?? '')
cek('gambar QRIS bisa diakses 200', qr.status === 200, String(qr.status))
cek('gambar QRIS bertipe image', (qr.headers.get('content-type') ?? '').startsWith('image/'))

// --- orang lain tidak boleh menanyakan status tagihan ini ---
await login('admin@lapakpeta.test')
const statusAsing = await call(`/api/payments/${orderId}/status`)
cek('status tagihan orang lain 403', statusAsing.status === 403, String(statusAsing.status))
// Cookie sesi baru dibuat setiap login, jadi yang dibandingkan adalah identitas
// akunnya, bukan nilai cookie-nya.
cek('kembali sebagai pemilik', (await login('pemilik@lapakpeta.test')) === 200)
const siapaAku = await call('/api/auth/me')
cek(
  'sesi pemilik aktif lagi',
  siapaAku.json?.email === 'pemilik@lapakpeta.test',
  String(siapaAku.json?.email),
)

// --- tagihan tanpa sesi ditolak ---
const simpanCookie = cookie
cookie = ''
const statusTanpaSesi = await call(`/api/payments/${orderId}/status`)
cek('status tanpa sesi 401', statusTanpaSesi.status === 401, String(statusTanpaSesi.status))
cookie = simpanCookie

// --- bayar di simulator, lalu status harus berubah ---
const snapToken = checkout.json?.qrImageUrl?.match(/snap_([A-Za-z0-9]+)/)?.[0]
const bayar = await lunasiDiSimulator(snapToken)
cek(
  'simulator menyatakan lunas',
  bayar.json?.status === 'PAID',
  JSON.stringify(bayar.json).slice(0, 200),
)

const sesudah = await call(`/api/payments/${orderId}/status`)
cek('cek status sesudah bayar 200', sesudah.status === 200, String(sesudah.status))
cek('sesudah bayar lunas', sesudah.json?.lunas === true, String(sesudah.json?.lunas))
cek('boost ditandai aktif', sesudah.json?.aktif === true, String(sesudah.json?.aktif))

// --- idempoten: memanggil sekali lagi tidak mengubah apa pun ---
const ulang = await call(`/api/payments/${orderId}/status`)
cek('status tetap lunas saat dicek ulang', ulang.json?.lunas === true, String(ulang.json?.lunas))
cek('tidak mengaktifkan dua kali', ulang.json?.aktif === false, String(ulang.json?.aktif))

// --- boost benar-benar tampil di data lapak ---
const detail = await call(`/api/businesses/${idLapak}`)
cek('lapak jadi boost aktif', detail.json?.isBoosted === true, String(detail.json?.isBoosted))

// --- setelah boost aktif, membeli lagi ditolak ---
const dobel = await call('/api/boosts', {
  method: 'POST',
  body: JSON.stringify({ businessId: idLapak, packageId: paketUji?.id }),
})
cek('boost dobel ditolak 409', dobel.status === 409, String(dobel.status))

// --- webhook dengan tanda tangan asli tetap diterima ---
const isiWebhook = JSON.stringify({
  event: 'payment.success',
  data: { reference: checkout.json?.reference, external_id: orderId, status: 'PAID' },
})
const tandaTangan = createHmac('sha256', webhookSecret).update(isiWebhook).digest('hex')
const webhookBenar = await call('/api/payments/notification', {
  method: 'POST',
  body: isiWebhook,
  headers: { 'x-miomipay-signature': tandaTangan },
})
cek('webhook tanda tangan benar 200', webhookBenar.status === 200, String(webhookBenar.status))
cek('webhook mengenali pesanannya', webhookBenar.json?.ditemukan === true)

// Tanda tangan dari body yang berbeda harus ditolak.
const diubah = isiWebhook.replace('PAID', 'EXPIRED')
const webhookDiubah = await call('/api/payments/notification', {
  method: 'POST',
  body: diubah,
  headers: { 'x-miomipay-signature': tandaTangan },
})
cek('webhook body diubah 401', webhookDiubah.status === 401, String(webhookDiubah.status))

// --- bersihkan lapak uji beserta boost dan pembayarannya ---
const hapus = await call(`/api/businesses/${idLapak}`, { method: 'DELETE' })
cek('lapak uji dihapus', hapus.status === 200 || hapus.status === 204, String(hapus.status))

console.log(`\nHASIL: ${pass} PASS, ${fail} FAIL`)
process.exit(fail ? 1 : 0)
