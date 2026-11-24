// Verifikasi tema dan SEO langsung dari HTML yang dirender server.
const BASE = 'http://127.0.0.1:3111'
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

const detail = await fetch(`${BASE}/lapak/warung-bu-sari`).then(r => r.text())
cek('detail ada og:title', /property="og:title"/.test(detail))
cek('detail ada og:description', /property="og:description"/.test(detail))
cek('detail ada canonical', /rel="canonical"/.test(detail))
cek('detail ada data terstruktur LocalBusiness', detail.includes('LocalBusiness'))
cek(
  'data terstruktur berisi koordinat',
  /"latitude":-?[0-9.]+/.test(detail.replace(/&quot;/g, '"')),
  detail.includes('GeoCoordinates')
    ? 'GeoCoordinates ada, latitude tidak'
    : 'GeoCoordinates tidak ada',
)

const beranda = await fetch(BASE).then(r => r.text())
cek('beranda memuat skrip tema awal', beranda.includes('lapak-peta-tema'))
cek('beranda tidak menulis kelas dark di server', !/<html[^>]*class="[^"]*dark/.test(beranda))

// CSS gelap harus benar benar ada di bundel supaya tombol tema punya efek.
const cssUrl = beranda.match(/href="(\/_nuxt\/[^"]+\.css)"/)?.[1]
cek('beranda menautkan berkas CSS', Boolean(cssUrl), String(cssUrl))
if (cssUrl) {
  const css = await fetch(BASE + cssUrl).then(r => r.text())
  cek('CSS memuat aturan .dark', /\.dark\{/.test(css.replace(/\s/g, '')) || css.includes('.dark'))
  cek('CSS memuat warna latar gelap', css.includes('#15130f'))
}

console.log(`\nHASIL: ${pass} PASS, ${fail} FAIL`)
process.exit(fail ? 1 : 0)
