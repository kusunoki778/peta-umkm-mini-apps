# Lapak Peta

Peta interaktif untuk menemukan tempat makan, kos, dan jasa di sekitar kampus. Pemilik usaha bisa mendaftarkan lapaknya, lalu membayar paket boost supaya lapaknya menonjol di peta dan muncul di atas daftar rekomendasi.

Status proyek: **Fase 0 sampai 5 selesai**. Peta interaktif, pencarian, filter kategori, CRUD lapak, boost berbayar lewat Midtrans Snap, webhook, dan panel admin sudah berjalan. Belum ada: unggah foto lapak, deployment, tangkapan layar, dan studi kasus.

## Masalah yang Dipecahkan

Pendatang seperti mahasiswa baru kesulitan menemukan tempat makan, kos, atau bengkel di sekitar kampus karena informasinya tersebar. Sebaliknya, pemilik usaha kecil jarang punya kanal digital sendiri. Lapak Peta menyatukan keduanya: peta untuk mencari, dan kanal sederhana untuk pemilik usaha tampil.

## Fitur Rencana

- Peta interaktif dengan marker per kategori (kuliner, kos, bengkel, jasa lain).
- Filter kategori dan pencarian nama maupun pencarian "di sekitar saya".
- CRUD lapak oleh pemilik: nama, foto, jam buka, dan daftar menu atau layanan.
- Boost lapak berbayar lewat payment gateway: marker berubah emas dan lapak naik ke atas daftar.
- Verifikasi dan moderasi lapak oleh admin.

## Tumpukan Teknologi

- Nuxt 4, Vue 3, TypeScript
- Tailwind CSS
- PostgreSQL dan PostGIS
- Prisma
- Leaflet dan OpenStreetMap
- Midtrans Snap

Alasan pemilihan tiap alat ada di [docs/05-tech-stack.md](docs/05-tech-stack.md).

## Dokumen

| Dokumen | Isi |
|---|---|
| [docs/01-desain.md](docs/01-desain.md) | Arah desain: identitas, palet, tipografi, marker, keadaan, aksesibilitas |
| [docs/02-prd.md](docs/02-prd.md) | Kebutuhan produk: tujuan, persona, user story, monetisasi, aturan bisnis |
| [docs/03-arsitektur.md](docs/03-arsitektur.md) | Arsitektur: struktur folder, model data, API, PostGIS, pembayaran |
| [docs/04-task-list.md](docs/04-task-list.md) | Rencana pengerjaan per fase |
| [docs/05-tech-stack.md](docs/05-tech-stack.md) | Saran bahasa dan alasan pemilihan tumpukan |

## Diagram Alur Boost

```
Pemilik -> Pilih paket -> Server buat Snap token -> Midtrans Snap (bayar)
      -> Webhook tervalidasi -> Boost aktif -> Marker emas + naik urutan
      -> Lewat tanggal berakhir -> Boost nonaktif
```

## Menjalankan Proyek

Butuh Node.js 20 atau lebih baru, dan PostgreSQL 14 atau lebih baru dengan ekstensi `cube` dan `earthdistance` aktif (keduanya bawaan contrib, tanpa PostGIS).

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
# lalu isi DATABASE_URL, NUXT_APP_SECRET, dan kunci Midtrans di .env
npm run db:generate         # generate Prisma Client
npm run db:migrate          # buat tabel dan aktifkan ekstensi geospasial
npm run db:seed             # isi data contoh (opsional)
npm run dev                 # buka http://localhost:3000
```

Isi `.env` untuk pembayaran boost:

```
MIDTRANS_SERVER_KEY=SB-Mid-server-...
NUXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
NUXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
```

Kunci sandbox diambil dari dashboard Midtrans. Izin yang dibutuhkan cukup **Snap Checkout: Write**. Bila kunci belum diisi, halaman boost menampilkan peringatan dan tidak mengirim permintaan ke Midtrans.

Skrip lain: `npm run build`, `npm run lint`, `npm run typecheck`, `npm run db:studio`.

Untuk menerima webhook pembayaran di mesin lokal, jalankan `ngrok http 3000` lalu isi Payment Notification URL di dashboard Midtrans dengan `https://<url-ngrok>/api/payments/notification`.

## Rencana Selanjutnya

- [x] Scaffold proyek dan token desain
- [x] Autentikasi dan CRUD lapak
- [x] Peta dan pencarian
- [x] Boost dan pembayaran
- [x] Panel admin
- [ ] Unggah foto lapak
- [ ] Deployment, tangkapan layar, dan studi kasus

## Lisensi

Belum ditentukan.
