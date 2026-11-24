// Uji unggah foto lapak: validasi jenis, pengecilan ukuran, kepemilikan, dan hapus.
const BASE = 'http://127.0.0.1:3111'
let pass = 0
let fail = 0
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
  // Path relatif berarti berkas statis; alamat absolut dipakai apa adanya.
  const url = path.startsWith('http') ? path : BASE + path
  const headers = {
    ...(typeof options.body === 'string' ? { 'content-type': 'application/json' } : {}),
    ...(cookie ? { cookie } : {}),
    ...(options.headers ?? {}),
  }
  const r = await fetch(url, { ...options, headers, redirect: 'manual' })
  for (const c of r.headers.getSetCookie?.() ?? []) {
    if (c.startsWith('nuxt-auth-session=')) cookie = c.split(';')[0]
  }
  const buf = Buffer.from(await r.arrayBuffer())
  const teks = buf.toString('utf8')
  let json = null
  try {
    json = JSON.parse(teks)
  } catch {
    // bukan JSON
  }
  return { status: r.status, json, teks, buf, tipe: r.headers.get('content-type') }
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

// Foto uji dibuat dengan sharp, bukan disiapkan sebagai berkas biner.
const { default: sharp } = await import('sharp')
let jpeg
let png
try {
  jpeg = await sharp({
    create: { width: 1600, height: 1200, channels: 3, background: { r: 34, g: 139, b: 87 } },
  })
    .jpeg()
    .toBuffer()
  png = await sharp({
    create: { width: 300, height: 200, channels: 3, background: { r: 200, g: 60, b: 40 } },
  })
    .png()
    .toBuffer()
} catch (error) {
  console.log('GAGAL menyiapkan foto uji:', error.message, error.stack)
  process.exit(1)
}
console.log('foto uji siap: jpeg', jpeg.length, 'png', png.length)
const teksPalsu = Buffer.from('ini bukan gambar, hanya teks biasa yang dinamai jpg')

function formData(berkas, nama, tipe, alt) {
  const fd = new FormData()
  fd.append('foto', new Blob([berkas], { type: tipe }), nama)
  if (alt) fd.append('alt', alt)
  return fd
}

// --- akses tanpa sesi ---
const tanpaSesi = await call('/api/businesses/warung-bu-sari/photos', {
  method: 'POST',
  body: formData(jpeg, 'a.jpg', 'image/jpeg'),
})
cek('unggah tanpa sesi 401', tanpaSesi.status === 401, String(tanpaSesi.status))

cek('login pemilik', (await login('pemilik@lapakpeta.test')) === 200)

// --- mulai dari keadaan bersih supaya batas jumlah foto tidak mengganggu ---
const lapakSaya = await call('/api/me/businesses')
for (const item of lapakSaya.json ?? []) {
  const detailBersih = await call(`/api/businesses/${item.slug}`)
  for (const foto of detailBersih.json?.photos ?? []) {
    await call(`/api/photos/${foto.id}`, { method: 'DELETE' })
  }
}

// --- foto milik lapak sendiri ---
const detail = await call('/api/businesses/warung-bu-sari')
const idLapak = detail.json?.id
const jumlahAwal = detail.json?.photos?.length ?? -1
cek('detail lapak punya data foto', Array.isArray(detail.json?.photos), String(jumlahAwal))

const unggah = await call(`/api/businesses/${idLapak}/photos`, {
  method: 'POST',
  body: formData(jpeg, 'etalase.jpg', 'image/jpeg', 'Etalase depan warung'),
})
cek('unggah JPEG 200', unggah.status === 200, `${unggah.status} ${unggah.teks.slice(0, 200)}`)
cek('respons berisi id foto', typeof unggah.json?.id === 'string')
cek('respons berisi url /uploads/', String(unggah.json?.url ?? '').startsWith('/uploads/'))
cek('respons berisi alt', unggah.json?.alt === 'Etalase depan warung', String(unggah.json?.alt))
cek(
  'foto 1600px diperkecil (lebar <= 960)',
  Number(unggah.json?.width) > 0 && Number(unggah.json?.width) <= 960,
  String(unggah.json?.width),
)

// --- berkas hasil simpan benar benar bisa diakses dan sudah WebP ---
const urlKartu = unggah.json?.url ?? ''
const ambilKartu = await call(urlKartu)
cek(
  'berkas kartu bisa diakses 200',
  ambilKartu.status === 200,
  `${ambilKartu.status} ${ambilKartu.teks.slice(0, 120)}`,
)
cek('isi berkas berformat WebP', ambilKartu.buf.subarray(0, 4).toString('ascii') === 'RIFF')
cek(
  'berkas disajikan sebagai image/webp',
  ambilKartu.tipe?.startsWith('image/webp') === true,
  String(ambilKartu.tipe),
)
if (ambilKartu.status === 200) {
  const metaKartu = await sharp(ambilKartu.buf).metadata()
  cek('berkas kartu lebarnya 480', metaKartu.width === 480, String(metaKartu.width))
} else {
  cek('berkas kartu lebarnya 480', false, 'berkas tidak bisa diambil')
}

const urlDetail = urlKartu.replace('-kartu.webp', '-detail.webp')
const ambilDetail = await call(urlDetail)
cek('berkas detail bisa diakses 200', ambilDetail.status === 200, String(ambilDetail.status))

// --- foto lama ikut tersimpan di detail lapak ---
const detailSetelah = await call('/api/businesses/warung-bu-sari')
cek(
  'jumlah foto bertambah satu',
  (detailSetelah.json?.photos?.length ?? 0) === jumlahAwal + 1,
  `${detailSetelah.json?.photos?.length} vs ${jumlahAwal + 1}`,
)
cek(
  'foto baru urut paling akhir',
  detailSetelah.json?.photos?.at(-1)?.id === unggah.json?.id,
  String(detailSetelah.json?.photos?.at(-1)?.id),
)

// --- PNG kecil tidak dipaksa membesar ---
const unggahPng = await call(`/api/businesses/${idLapak}/photos`, {
  method: 'POST',
  body: formData(png, 'kecil.png', 'image/png'),
})
cek(
  'unggah PNG 200',
  unggahPng.status === 200,
  `${unggahPng.status} ${unggahPng.teks.slice(0, 160)}`,
)
cek(
  'PNG 300px tidak diperbesar',
  Number(unggahPng.json?.width) === 300,
  String(unggahPng.json?.width),
)

// --- berkas bukan gambar ditolak ---
const unggahPalsu = await call(`/api/businesses/${idLapak}/photos`, {
  method: 'POST',
  body: formData(teksPalsu, 'palsu.jpg', 'image/jpeg'),
})
cek('berkas bukan gambar ditolak 422', unggahPalsu.status === 422, String(unggahPalsu.status))
cek(
  'pesan penolakan menjelaskan berkas tidak terbaca sebagai gambar',
  /gambar/i.test(unggahPalsu.json?.message ?? ''),
  String(unggahPalsu.json?.message),
)

// --- lapak milik orang lain ditolak ---
// Semua lapak seed dimiliki akun pemilik, jadi pembandingnya lapak baru milik akun
// admin. Tanpa ini, "kafe-kopi-ruang" justru milik pemilik sendiri dan ujinya bohong.
const cookiePemilik = cookie
cookie = ''
const loginAdmin = await login('admin@lapakpeta.test')
const adminCookie = cookie
cek('login admin untuk pembanding', loginAdmin === 200, String(loginAdmin))

const kategori = await call('/api/categories')
const lapakAdmin = await call('/api/businesses', {
  method: 'POST',
  body: JSON.stringify({
    name: `Lapak Pembanding Uji ${Date.now()}`,
    categoryId: kategori.json?.[0]?.id,
    address: 'Jl. Uji Kepemilikan No. 1',
    latitude: -6.8915,
    longitude: 107.6107,
  }),
})
const idOrangLain = lapakAdmin.json?.id
cek(
  'lapak pembanding milik admin dibuat',
  Boolean(idOrangLain),
  `${lapakAdmin.status} ${lapakAdmin.teks.slice(0, 160)}`,
)

// Kembali sebagai pemilik untuk menguji penolakan.
cookie = cookiePemilik
const ulang = await call('/api/auth/me')
cek(
  'kembali sebagai pemilik',
  ulang.json?.email === 'pemilik@lapakpeta.test',
  String(ulang.json?.email),
)

const unggahAsing = await call(`/api/businesses/${idOrangLain}/photos`, {
  method: 'POST',
  body: formData(png, 'x.png', 'image/png'),
})
cek('unggah ke lapak orang lain 403', unggahAsing.status === 403, String(unggahAsing.status))

// --- batas jumlah foto ---
// Isi dulu sampai tepat 6, baru percobaan berikutnya harus ditolak.
const detailBatas = await call('/api/businesses/warung-bu-sari')
const jumlahSekarang = detailBatas.json?.photos?.length ?? 0
for (let i = jumlahSekarang; i < 6; i++) {
  const isi = await call(`/api/businesses/${idLapak}/photos`, {
    method: 'POST',
    body: formData(png, `isi-${i}.png`, 'image/png'),
  })
  cek(`isi slot foto ke-${i + 1}`, isi.status === 200, String(isi.status))
}
const terakhir = await call(`/api/businesses/${idLapak}/photos`, {
  method: 'POST',
  body: formData(png, 'kelebihan.png', 'image/png'),
})
cek('foto melebihi batas 6 ditolak 422', terakhir.status === 422, String(terakhir.status))
cek(
  'pesan batas menyebut maksimal',
  /maksimal/i.test(terakhir.json?.message ?? ''),
  String(terakhir.json?.message),
)

// --- hapus foto ---
const hapus = await call(`/api/photos/${unggah.json?.id}`, { method: 'DELETE' })
cek('hapus foto 200', hapus.status === 200, `${hapus.status} ${hapus.teks.slice(0, 160)}`)

const berkasSetelahHapus = await call(urlKartu)
cek(
  'berkas foto ikut terhapus dari disk',
  berkasSetelahHapus.status === 404,
  String(berkasSetelahHapus.status),
)

const detailAkhir = await call('/api/businesses/warung-bu-sari')
cek(
  'baris foto hilang dari basis data',
  !(detailAkhir.json?.photos ?? []).some(p => p.id === unggah.json?.id),
)

// --- hapus foto milik orang lain ---
const fotoOrangLain = (await call(`/api/businesses/${idOrangLain}`)).json?.photos?.[0]
if (fotoOrangLain) {
  const hapusAsing = await call(`/api/photos/${fotoOrangLain.id}`, { method: 'DELETE' })
  cek('hapus foto lapak orang lain 403', hapusAsing.status === 403, String(hapusAsing.status))
} else {
  cek('hapus foto lapak orang lain 403', true, 'dilewati, lapak pembanding belum punya foto')
}

// Bersihkan lapak pembanding supaya tidak mengotori peta.
if (adminCookie) {
  const hapusLapak = await call(`/api/businesses/${idOrangLain}`, {
    method: 'DELETE',
    headers: { cookie: adminCookie },
  })
  cek(
    'lapak pembanding dibersihkan',
    hapusLapak.status === 200 || hapusLapak.status === 204,
    String(hapusLapak.status),
  )
}

// --- tema gelap tersimpan di HTML ---
const beranda = await call('/')
cek('skrip tema awal ada di HTML', beranda.teks.includes('lapak-peta-tema'))
cek('tombol ganti tema ada', beranda.teks.includes('Ganti ke tema gelap'))

console.log(`\nHASIL: ${pass} PASS, ${fail} FAIL`)
if (fail) {
  console.log('GAGAL:')
  gagal.forEach(g => console.log(' - ' + g))
}
process.exit(fail ? 1 : 0)
