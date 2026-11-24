// Uji ujung ke ujung: login pemilik, buat checkout boost, lalu panggil Snap Midtrans asli.
const BASE = 'http://localhost:3000'
let pass = 0, fail = 0
function cek(nama, ok, info = '') {
  if (ok) { pass++; console.log(`PASS  ${nama}`) }
  else { fail++; console.log(`FAIL  ${nama} :: ${info}`) }
}

let cookie = ''
async function call(path, options = {}) {
  const r = await fetch(BASE + path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...(options.headers ?? {}) },
    redirect: 'manual',
  })
  const setCookie = r.headers.getSetCookie?.() ?? []
  for (const c of setCookie) {
    if (c.startsWith('nuxt-auth-session=')) cookie = c.split(';')[0]
  }
  const text = await r.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* respons bukan JSON, biarkan null */ }
  return { status: r.status, json, text }
}

const cfg = await call('/api/payments/config')
cek('config: server key terbaca', cfg.json?.serverKeySet === true, JSON.stringify(cfg.json))
cek('config: client key terbaca', cfg.json?.clientKeySet === true)
cek('config: mode sandbox', cfg.json?.serverKeySandbox === true)

const login = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'pemilik@lapakpeta.test', password: 'rahasia123' }) })
cek('login pemilik 200', login.status === 200, `${login.status} ${login.text.slice(0, 200)}`)

const lapakSaya = await call('/api/me/businesses')
const daftar = lapakSaya.json ?? []
const tanpaBoost = daftar.find(b => !b.boostAktif) ?? daftar[0]
cek('punya lapak untuk diuji', Boolean(tanpaBoost), JSON.stringify(daftar.map?.(b => b.slug)))

const paket = await call('/api/boost-packages')
cek('paket boost tersedia', Array.isArray(paket.json) && paket.json.length > 0, String(paket.status))

const target = tanpaBoost?.slug ?? 'warung-bu-sari'
const detail = await call(`/api/businesses/${target}`)
const businessId = detail.json?.id
cek('detail lapak dapat id', Boolean(businessId), String(detail.status))

const checkout = await call('/api/boosts', {
  method: 'POST',
  body: JSON.stringify({ businessId, packageId: paket.json?.[0]?.id }),
})
console.log('--- respons checkout ---')
console.log(checkout.status, JSON.stringify(checkout.json).slice(0, 400))
cek('checkout 200', checkout.status === 200, `${checkout.status} ${checkout.text.slice(0, 300)}`)
cek('checkout mengembalikan snapToken', typeof checkout.json?.snapToken === 'string' && checkout.json.snapToken.length > 10)
cek('checkout mengembalikan orderId', typeof checkout.json?.orderId === 'string' && checkout.json.orderId.startsWith('boost-'))

// Catatan: Core API sengaja tidak dipakai (permission `Core API: None`), jadi status
// transaksi tidak bisa dibaca dari sini. Verifikasi token dilakukan dengan membuka
// redirect_url Snap, yang hanya ada kalau transaksi benar benar terdaftar.
if (checkout.json?.snapToken) {
  const redirectUrl = `https://app.sandbox.midtrans.com/snap/v4/redirection/${checkout.json.snapToken}`
  const halaman = await fetch(redirectUrl, { redirect: 'manual' })
  cek('halaman Snap bisa dibuka', halaman.status === 200 || halaman.status === 302, String(halaman.status))
}

console.log(`\nHASIL: ${pass} PASS, ${fail} FAIL`)
process.exit(fail ? 1 : 0)
