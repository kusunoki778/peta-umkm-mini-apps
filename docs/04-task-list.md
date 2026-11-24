# 04 - Task List

Daftar tugas dikelompokkan per fase. Tanda centang menandai pekerjaan yang sudah selesai. Estimasi dalam satuan hari kerja per orang, bersifat perkiraan untuk perencanaan.

## Fase 0 - Persiapan

- [x] Inisialisasi proyek Nuxt 4 dengan TypeScript
- [x] Pasang Tailwind CSS v4 dan siapkan token desain dari `docs/01-desain.md`
- [x] Pasang dan konfigurasi Prisma (schema, client, `prisma7.config.ts`)
- [x] Aktifkan ekstensi geospasial di basis data (PostGIS tidak tersedia di mesin dev, dipakai `cube` + `earthdistance` dengan indeks GiST; PostGIS tetap jalur produksi)
- [x] Buat `.env.example` dan sambungkan kunci yang dibutuhkan
- [x] Siapkan ESLint
- [x] Siapkan Prettier (`.prettierrc.json`, `npm run format`, `npm run format:check`; aturan `vue/html-self-closing` diselaraskan supaya tidak bertabrakan dengan Prettier)
- [x] Inisialisasi Git dan sambungkan ke repositori (push menunggu repo GitHub dibuat)
- [x] Tulis skrip seed untuk lapak contoh

Estimasi: 1 hari.

## Fase 1 - Fondasi

- [x] Layout dasar (header, peta, panel daftar) untuk desktop dan mobile
- [ ] Komponen dasar: Button, Chip, Sheet, EmptyState, LoadingSkeleton, Toast (baru ada `AppField`, `ChipKategori`, `KartuLapak`, `PetaLapak`, `PemilihTitik`, `UnggahFoto`; Toast dan Sheet belum)
- [x] Tema terang dan gelap dengan pengalih yang benar-benar bekerja (tombol di header, pilihan disimpan di localStorage, skrip awal mencegah kedip, mengikuti `prefers-color-scheme` bila belum ada pilihan)
- [x] Skema Prisma untuk users, categories, businesses, dan tabel pendukung
- [x] Migrasi pertama dan jalankan seed
- [x] Registrasi, login, logout, dan sesi
- [x] Middleware peran (pemilik dan admin)
- [x] Halaman 403 dan 404 (`app/error.vue` menangani 404 dan error lain; 403 muncul sebagai pesan di halaman terkait)

Estimasi: 3 sampai 4 hari.

## Fase 2 - CRUD Lapak

- [x] Endpoint daftar, detail, tambah, ubah, dan hapus lapak
- [x] Validasi input memakai Zod
- [x] Form tambah lapak dengan pemilih titik di peta (klik peta mengisi lintang dan bujur, kolomnya tetap bisa diedit manual, plus tombol "Cari lokasi di peta" memakai Nominatim dan "Pakai lokasi saya sekarang")
- [x] Unggah foto dengan validasi dan pengecilan ukuran (maksimal 6 foto, JPG/PNG/WebP, maksimal 5 MB, diperkecil ke tiga ukuran WebP 480/960/1440 px, jenis berkas diperiksa dari isinya bukan dari nama)
- [x] Pengelolaan item menu atau layanan
- [x] Pengaturan jam buka
- [x] Dashboard pemilik: daftar lapak, status verifikasi, aksi
- [x] Hapus lunak
- [x] Pembatasan akses: pemilik hanya mengelola lapaknya sendiri

Catatan teknis penting: seluruh berkas rute di bawah `server/api/businesses` memakai satu nama parameter segmen, yaitu `:key`, yang menerima id maupun slug. Alasannya, router Nitro (`radix3`) gagal mencocokkan rute bersarang seperti `/api/businesses/:id/items` bila di posisi segmen yang sama ada dua nama parameter berbeda (`:id` dan `:slug`); permintaan lalu jatuh ke renderer Vue dan muncul sebagai 404. Jangan mengembalikan pemisahan `[id]` dan `[slug]` tanpa menguji ulang.

Estimasi: 4 sampai 5 hari.

## Fase 3 - Peta dan Pencarian (GIS)

- [x] Komponen peta Leaflet yang hanya berjalan di klien
- [x] Marker kategori memakai `divIcon` sesuai desain
- [x] Pengelompokan marker (clustering)
- [x] Filter kategori multi-pilih, tersinkron dengan peta dan daftar
- [x] Pencarian nama dengan jeda
- [x] Pencarian sekitar saya dengan izin lokasi dan penanganan penolakan
- [x] Halaman detail lapak
- [x] Urutan daftar memakai query PostGIS (di dev sudah jalan lewat `cube` + `earthdistance`)
- [x] Keadaan loading, empty, dan error untuk peta dan daftar

Estimasi: 4 sampai 5 hari.

## Fase 4 - Boost dan Pembayaran

- [x] Tabel dan data paket boost
- [x] Endpoint pembuatan boost dan tagihan QRIS MiomiPay
- [x] Halaman pemilihan paket dan checkout
- [x] Halaman pembayaran QRIS dengan gambar QR dan tautan halaman MiomiPay
- [x] Endpoint webhook dengan verifikasi HMAC-SHA256 (`X-MiomiPay-Signature`)
- [x] Aktivasi boost yang idempoten, dipusatkan di `server/utils/pembayaran.ts`
- [x] Marker emas dan gaya boost di daftar
- [x] Urutan daftar: boost lebih dulu
- [x] Penonaktifan otomatis saat boost berakhir
- [x] Riwayat boost untuk pemilik
- [x] Pengecekan status transaksi lewat polling ke MiomiPay, tanpa butuh tunnel
- [x] Polling otomatis tiap 5 detik di halaman boost, plus tombol "Saya sudah bayar"
- [x] Halaman boost memeriksa kesiapan kunci lewat `/api/payments/config`
- [x] Pesan error penyedia pembayaran diteruskan ke UI, bukan gagal senyap

Estimasi: 4 sampai 5 hari.

## Fase 5 - Panel Admin

- [x] Layout admin yang dirancang, bukan sisipan
- [x] Daftar lapak menunggu verifikasi
- [x] Aksi setujui, tolak dengan alasan, dan nonaktifkan
- [x] Daftar transaksi dan pencocokan pembayaran
- [x] Pengelolaan kategori

Estimasi: 3 hari.

## Fase 6 - Penyelesaian dan Portofolio

- [ ] Audit aksesibilitas menyeluruh: kontras seluruh halaman, urutan tab, `prefers-reduced-motion` pada semua animasi (sebagian sudah: indikator fokus, label `aria`, `role="alert"`, animasi marker berhenti saat reduced motion)
- [ ] Audit keadaan menyeluruh: skeleton, kosong, dan error di semua halaman (halaman peta, kelola, boost, dan admin sudah punya ketiganya; halaman masuk dan daftar belum)
- [x] SEO halaman detail lapak (judul, deskripsi, canonical, Open Graph, Twitter card, dan data terstruktur `LocalBusiness` dengan koordinat)
- [ ] Pengukuran dan penyetelan performa peta (clustering dan `srcset` foto sudah ada, belum ada pengukuran nyata)
- [ ] Cek responsif di semua breakpoint pada perangkat sungguhan
- [ ] Deployment dan basis data produksi dengan PostGIS
- [ ] Isi README dengan tangkapan layar nyata (penjelasan arsitektur dan akun contoh sudah ada)
- [ ] Tulis catatan studi kasus: masalah, keputusan, hasil
- [x] Siapkan akun demo untuk meninjau portofolio (tercatat di README; belum ada deployment publik)
- [x] Bersihkan kode dan hapus data uji yang tidak perlu (`scripts/bersih-foto.mjs`, Prettier, aturan lint, data uji dikembalikan ke keadaan seed)

Estimasi: 2 sampai 3 hari.

## Ringkasan

Total perkiraan: sekitar 21 sampai 26 hari kerja untuk satu orang. Urutan pengerjaan mengikuti fase; fitur boost dikerjakan setelah peta dasar berjalan supaya status boost punya tempat untuk tampil.
