const BASE = 'http://127.0.0.1:3111'
let pass = 0
async function cek(nama, promise, expected) {
  const response = await promise
  const ok = response.status === expected
  console.log(`${ok ? 'PASS' : 'FAIL'} ${nama}: ${response.status}`)
  if (ok) pass++
  return response
}
const unauth = await cek('admin tanpa sesi ditolak', fetch(`${BASE}/api/admin/businesses`), 401)
const page = await cek('halaman admin tanpa sesi redirect', fetch(`${BASE}/admin`, { redirect: 'manual' }), 302)
console.log(`HASIL: ${pass}/2 PASS`)
process.exit(pass === 2 ? 0 : 1)
