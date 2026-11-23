# 04 - Task List

Daftar tugas dikelompokkan per fase. Tanda centang menandai pekerjaan yang sudah selesai. Estimasi dalam satuan hari kerja per orang, bersifat perkiraan untuk perencanaan.

## Fase 0 - Persiapan

- [x] Inisialisasi proyek Nuxt 4 dengan TypeScript
- [x] Pasang Tailwind CSS v4 dan siapkan token desain dari `docs/01-desain.md`
- [x] Pasang dan konfigurasi Prisma (schema, client, `prisma7.config.ts`)
- [x] Aktifkan ekstensi geospasial di basis data (PostGIS tidak tersedia di mesin dev, dipakai `cube` + `earthdistance` dengan indeks GiST; PostGIS tetap jalur produksi)
- [x] Buat `.env.example` dan sambungkan kunci yang dibutuhkan
- [x] Siapkan ESLint
- [ ] Siapkan Prettier
- [x] Inisialisasi Git dan sambungkan ke repositori (push menunggu repo GitHub dibuat)
- [x] Tulis skrip seed untuk lapak contoh

Estimasi: 1 hari.

## Fase 1 - Fondasi

- [ ] Layout dasar (header, peta, panel daftar) untuk desktop dan mobile
- [ ] Komponen dasar: Button, Chip, Sheet, EmptyState, LoadingSkeleton, Toast
- [ ] Tema terang dan gelap dengan pengalih yang benar-benar bekerja
- [x] Skema Prisma untuk users, categories, businesses, dan tabel pendukung
- [x] Migrasi pertama dan jalankan seed
- [x] Registrasi, login, logout, dan sesi
- [x] Middleware peran (pemilik dan admin)
- [ ] Halaman 403 dan 404

Estimasi: 3 sampai 4 hari.

## Fase 2 - CRUD Lapak

- [x] Endpoint daftar, detail, tambah, ubah, dan hapus lapak
- [x] Validasi input memakai Zod
- [ ] Form tambah lapak dengan pemilih titik di peta (sementara masih input lintang dan bujur manual plus tombol "Pakai lokasi saya sekarang"; pemilih titik di peta menyusul bersama komponen peta di Fase 3)
- [ ] Unggah foto dengan validasi dan pengecilan ukuran
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
- [x] Endpoint pembuatan boost dan Snap token
- [x] Halaman pemilihan paket dan checkout
- [x] Integrasi Snap di klien
- [x] Endpoint webhook dengan verifikasi tanda tangan
- [x] Aktivasi boost yang idempoten
- [x] Marker emas dan gaya boost di daftar
- [x] Urutan daftar: boost lebih dulu
- [x] Penonaktifan otomatis saat boost berakhir
- [x] Riwayat boost untuk pemilik
- [x] Pengecekan status transaksi sebagai cadangan

Estimasi: 4 sampai 5 hari.

## Fase 5 - Panel Admin

- [x] Layout admin yang dirancang, bukan sisipan
- [x] Daftar lapak menunggu verifikasi
- [x] Aksi setujui, tolak dengan alasan, dan nonaktifkan
- [x] Daftar transaksi dan pencocokan pembayaran
- [x] Pengelolaan kategori

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
