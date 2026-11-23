# 04 - Task List

Daftar tugas dikelompokkan per fase. Tanda centang menandai pekerjaan yang sudah selesai. Estimasi dalam satuan hari kerja per orang, bersifat perkiraan untuk perencanaan.

## Fase 0 - Persiapan

- [x] Inisialisasi proyek Nuxt 4 dengan TypeScript
- [x] Pasang Tailwind CSS v4 dan siapkan token desain dari `docs/01-desain.md`
- [x] Pasang dan konfigurasi Prisma (schema, client, `prisma7.config.ts`)
- [ ] Aktifkan ekstensi PostGIS di basis data (butuh PostgreSQL lokal)
- [x] Buat `.env.example` dan sambungkan kunci yang dibutuhkan
- [x] Siapkan ESLint
- [ ] Siapkan Prettier
- [x] Inisialisasi Git dan sambungkan ke repositori (push menunggu repo GitHub dibuat)
- [ ] Tulis skrip seed untuk lapak contoh

Estimasi: 1 hari.

## Fase 1 - Fondasi

- [ ] Layout dasar (header, peta, panel daftar) untuk desktop dan mobile
- [ ] Komponen dasar: Button, Chip, Sheet, EmptyState, LoadingSkeleton, Toast
- [ ] Tema terang dan gelap dengan pengalih yang benar-benar bekerja
- [ ] Skema Prisma untuk users, categories, businesses, dan tabel pendukung
- [ ] Migrasi pertama dan jalankan seed
- [ ] Registrasi, login, logout, dan sesi
- [ ] Middleware peran (pemilik dan admin)
- [ ] Halaman 403 dan 404

Estimasi: 3 sampai 4 hari.

## Fase 2 - CRUD Lapak

- [ ] Endpoint daftar, detail, tambah, ubah, dan hapus lapak
- [ ] Validasi input memakai Zod
- [ ] Form tambah lapak dengan pemilih titik di peta
- [ ] Unggah foto dengan validasi dan pengecilan ukuran
- [ ] Pengelolaan item menu atau layanan
- [ ] Pengaturan jam buka
- [ ] Dashboard pemilik: daftar lapak, status verifikasi, aksi
- [ ] Hapus lunak
- [ ] Pembatasan akses: pemilik hanya mengelola lapaknya sendiri

Estimasi: 4 sampai 5 hari.

## Fase 3 - Peta dan Pencarian (GIS)

- [ ] Komponen peta Leaflet yang hanya berjalan di klien
- [ ] Marker kategori memakai `divIcon` sesuai desain
- [ ] Pengelompokan marker (clustering)
- [ ] Filter kategori multi-pilih, tersinkron dengan peta dan daftar
- [ ] Pencarian nama dengan jeda
- [ ] Pencarian sekitar saya dengan izin lokasi dan penanganan penolakan
- [ ] Halaman detail lapak
- [ ] Urutan daftar memakai query PostGIS
- [ ] Keadaan loading, empty, dan error untuk peta dan daftar

Estimasi: 4 sampai 5 hari.

## Fase 4 - Boost dan Pembayaran

- [ ] Tabel dan data paket boost
- [ ] Endpoint pembuatan boost dan Snap token
- [ ] Halaman pemilihan paket dan checkout
- [ ] Integrasi Snap di klien
- [ ] Endpoint webhook dengan verifikasi tanda tangan
- [ ] Aktivasi boost yang idempoten
- [ ] Marker emas dan gaya boost di daftar
- [ ] Urutan daftar: boost lebih dulu
- [ ] Penonaktifan otomatis saat boost berakhir
- [ ] Riwayat boost untuk pemilik
- [ ] Pengecekan status transaksi sebagai cadangan

Estimasi: 4 sampai 5 hari.

## Fase 5 - Panel Admin

- [ ] Layout admin yang dirancang, bukan sisipan
- [ ] Daftar lapak menunggu verifikasi
- [ ] Aksi setujui, tolak dengan alasan, dan nonaktifkan
- [ ] Daftar transaksi dan pencocokan pembayaran
- [ ] Pengelolaan kategori

Estimasi: 3 hari.

## Fase 6 - Penyelesaian dan Portofolio

- [ ] Audit aksesibilitas: kontras, keyboard, `prefers-reduced-motion`
- [ ] Audit keadaan: loading, empty, error di semua halaman
- [ ] SEO halaman detail lapak
- [ ] Pengukuran dan penyetelan performa peta
- [ ] Cek responsif di semua breakpoint
- [ ] Deployment dan basis data produksi dengan PostGIS
- [ ] Isi README dengan tangkapan layar nyata dan penjelasan arsitektur
- [ ] Tulis catatan studi kasus: masalah, keputusan, hasil
- [ ] Siapkan akun demo untuk meninjau portofolio
- [ ] Bersihkan kode dan hapus data uji yang tidak perlu

Estimasi: 2 sampai 3 hari.

## Ringkasan

Total perkiraan: sekitar 21 sampai 26 hari kerja untuk satu orang. Urutan pengerjaan mengikuti fase; fitur boost dikerjakan setelah peta dasar berjalan supaya status boost punya tempat untuk tampil.
