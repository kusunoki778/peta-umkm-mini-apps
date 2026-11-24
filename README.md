# Lapak Peta

Peta interaktif untuk menemukan tempat makan, kos, dan jasa di sekitar kampus. Pemilik usaha bisa mendaftarkan lapaknya, lalu membayar paket boost supaya lapaknya menonjol di peta dan muncul di atas daftar rekomendasi.

Status proyek: **Fase 0 sampai 5 selesai, ditambah sebagian Fase 6**. Peta interaktif, pencarian, filter kategori, CRUD lapak, unggah foto, boost berbayar lewat Midtrans Snap, webhook, panel admin, dan tema terang atau gelap sudah berjalan. Belum ada: deployment, tangkapan layar, studi kasus, dan akun demo publik.

## Masalah yang Dipecahkan

Pendatang seperti mahasiswa baru kesulitan menemukan tempat makan, kos, atau bengkel di sekitar kampus karena informasinya tersebar. Sebaliknya, pemilik usaha kecil jarang punya kanal digital sendiri. Lapak Peta menyatukan keduanya: peta untuk mencari, dan kanal sederhana untuk pemilik usaha tampil.

## Fitur Rencana

- Peta interaktif dengan marker per kategori (kuliner, kos, bengkel, jasa lain).
- Filter kategori dan pencarian nama maupun pencarian "di sekitar saya".
- CRUD lapak oleh pemilik: nama, foto, jam buka, dan daftar menu atau layanan.
- Pencarian alamat memakai Nominatim: pemilik mengetik nama tempat, peta pindah ke titiknya, dan lintang serta bujur terisi otomatis. Titiknya tetap bisa diubah dengan klik peta, dan kedua kolom tetap bisa diedit manual.
- Unggah sampai 6 foto per lapak, otomatis diperkecil ke tiga ukuran WebP.
- Boost lapak berbayar lewat payment gateway: marker berubah emas dan lapak naik ke atas daftar.
- Verifikasi dan moderasi lapak oleh admin.
- Tema terang dan gelap yang pilihannya diingat peramban.

## Tumpukan Teknologi

- Nuxt 4, Vue 3, TypeScript
- Tailwind CSS v4
- PostgreSQL dengan `cube` + `earthdistance` (PostGIS disiapkan untuk produksi)
- Prisma 7
- Leaflet, OpenStreetMap, dan Nominatim
- Midtrans Snap
- Sharp untuk pengecilan foto

Alasan pemilihan tiap alat ada di [docs/05-tech-stack.md](docs/05-tech-stack.md).

## Dokumen

| Dokumen                                        | Isi                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| [docs/01-desain.md](docs/01-desain.md)         | Arah desain: identitas, palet, tipografi, marker, keadaan, aksesibilitas |
| [docs/02-prd.md](docs/02-prd.md)               | Kebutuhan produk: tujuan, persona, user story, monetisasi, aturan bisnis |
| [docs/03-arsitektur.md](docs/03-arsitektur.md) | Arsitektur: struktur folder, model data, API, PostGIS, pembayaran        |
| [docs/04-task-list.md](docs/04-task-list.md)   | Rencana pengerjaan per fase                                              |
| [docs/05-tech-stack.md](docs/05-tech-stack.md) | Saran bahasa dan alasan pemilihan tumpukan                               |

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

Skrip lain: `npm run build`, `npm run lint`, `npm run format`, `npm run format:check`, `npm run typecheck`, `npm run db:studio`.

Foto lapak disimpan di `public/uploads` dan tidak masuk Git. Folder itu dibuat otomatis saat unggahan pertama. Karena `public` hanya disalin ke build sekali, ada rute `server/routes/uploads/[nama].get.ts` yang menyajikan berkas langsung dari disk.

Untuk menerima webhook pembayaran di mesin lokal, jalankan `ngrok http 3000` lalu isi Payment Notification URL di dashboard Midtrans dengan `https://<url-ngrok>/api/payments/notification`.

## Akun Contoh dari Seed

| Peran   | Email                    | Kata sandi   |
| ------- | ------------------------ | ------------ |
| Admin   | `admin@lapakpeta.test`   | `rahasia123` |
| Pemilik | `pemilik@lapakpeta.test` | `rahasia123` |

Akun ini hanya untuk pengembangan lokal dan dibuat oleh `npm run db:seed`. Jangan dipakai di deployment sungguhan.

## Skrip Uji

Skrip uji menjalankan permintaan HTTP sungguhan terhadap build produksi di port 3111:

```bash
npm run build
PORT=3111 node .output/server/index.mjs
node scripts/uji-regresi.mjs     # 42 pemeriksaan alur utama
node scripts/uji-foto.mjs        # 36 pemeriksaan unggah foto
node scripts/uji-tema-seo.mjs    # 10 pemeriksaan tema dan SEO
node scripts/uji-webhook.mjs     # tanda tangan webhook dan idempotensi
node scripts/uji-admin.mjs       # pembatasan akses admin
```

`scripts/uji-foto.mjs` dan `scripts/uji-regresi.mjs` mengubah data, jadi jalankan pada basis data pengembangan. `scripts/bersih-foto.mjs` mengembalikan foto dan lapak buatan uji ke keadaan seed.

## Rencana Selanjutnya

- [x] Scaffold proyek dan token desain
- [x] Autentikasi dan CRUD lapak
- [x] Peta dan pencarian
- [x] Boost dan pembayaran
- [x] Panel admin
- [x] Unggah foto lapak
- [x] Tema terang dan gelap
- [x] Prettier dan aturan format yang tidak bertabrakan dengan ESLint
- [x] SEO halaman detail lapak
- [ ] Audit aksesibilitas dan responsif menyeluruh
- [ ] Deployment dan basis data produksi dengan PostGIS
- [ ] Tangkapan layar dan studi kasus

## Lisensi

Belum ditentukan.
