// Uji klik-through Fase 3: peta publik, filter, pencarian, urutan boost, detail.
const BASE = 'http://127.0.0.1:3111'
let pass = 0, fail = 0
const gagal = []
function cek(nama, ok, info = '') {
  if (ok) { pass++; console.log(`PASS  ${nama}`) }
  else { fail++; gagal.push(nama + (info ? ` :: ${info}` : '')); console.log(`FAIL  ${nama} ${info}`) }
}

async function get(path) {
  const r = await fetch(BASE + path, { redirect: 'manual' })
  const html = await r.text()
  return { status: r.status, html }
}
async function json(path) {
  const r = await fetch(BASE + path)
  const b = await r.json().catch(() => null)
  return { status: r.status, body: b }
}

const daftar = await json('/api/businesses?lat=-6.8915&lng=107.6107&radius=5000')
cek('API daftar 200', daftar.status === 200)
cek('API daftar ada 5 lapak', daftar.body?.items?.length === 5, String(daftar.body?.items?.length))
cek('boost di urutan pertama', daftar.body?.items?.[0]?.isBoosted === true, JSON.stringify(daftar.body?.items?.[0]?.slug))
cek('item pertama punya distanceMeters', typeof daftar.body?.items?.[0]?.distanceMeters === 'number')

const boostTerakhir = daftar.body.items.filter(i => i.isBoosted)
cek('hanya 1 lapak boost', boostTerakhir.length === 1, String(boostTerakhir.length))

const kat = await json('/api/categories')
cek('API kategori 200 + 4 item', kat.status === 200 && kat.body?.length === 4, String(kat.body?.length))

const kuliner = await json('/api/businesses?lat=-6.8915&lng=107.6107&radius=5000&category=kuliner')
cek('filter kuliner 3 hasil', kuliner.body?.items?.length === 3, String(kuliner.body?.items?.length))
cek('semua hasil kuliner', kuliner.body?.items?.every(i => i.category.slug === 'kuliner') === true)

const cari = await json('/api/businesses?q=kopi&lat=-6.8915&lng=107.6107&radius=5000')
cek('pencarian kopi 1 hasil', cari.body?.items?.length === 1, String(cari.body?.items?.length))

const urutNama = await json('/api/businesses?lat=-6.8915&lng=107.6107&radius=5000&sort=nama')
const namaArr = urutNama.body?.items?.map(i => i.name) ?? []
const boostPertama = urutNama.body?.items?.[0]?.isBoosted === true
const sisa = namaArr.slice(1)
cek('sort=nama tetap boost di atas', boostPertama && sisa.every((n, i) => i === 0 || sisa[i - 1].localeCompare(n, 'id') <= 0), JSON.stringify(namaArr))

const beranda = await get('/')
cek('beranda 200', beranda.status === 200)
cek('beranda judul', beranda.html.includes('Temukan lapak di sekitarmu'))
cek('beranda punya input cari', beranda.html.includes('id="cari-lapak"'))
cek('beranda punya urut', beranda.html.includes('id="urut"'))
cek('beranda punya chip Semua', beranda.html.includes('>Semua<') || beranda.html.includes('Semua'))
cek('beranda punya tombol lokasi', beranda.html.includes('Pakai lokasi saya'))
cek('beranda punya fallback peta', beranda.html.includes('Memuat peta'))
cek('beranda tanpa em dash', !beranda.html.includes('\u2014'))

const detailSlug = daftar.body.items.find(i => i.slug === 'kafe-kopi-ruang')?.slug
const detail = await get(`/lapak/${detailSlug}`)
cek('detail 200', detail.status === 200)
cek('detail tampil nama', detail.html.includes('Kafe Kopi Ruang'))
cek('detail badge unggulan', detail.html.includes('Lapak unggulan'))
cek('detail judul dokumen', detail.html.includes('Kafe Kopi Ruang'))
cek('detail tanpa em dash', !detail.html.includes('\u2014'))

const belum = await get('/lapak/laundry-kilat')
cek('lapak pending tak tayang (404)', belum.status === 404, String(belum.status))

const asing = await get('/lapak/tidak-ada-lapak')
cek('slug asing 404', asing.status === 404, String(asing.status))

console.log(`\nHASIL: ${pass} PASS, ${fail} FAIL`)
if (fail) { console.log('GAGAL:'); gagal.forEach(g => console.log(' - ' + g)) }
process.exit(fail ? 1 : 0)
