# Ndekat

Peta interaktif untuk menemukan tempat makan, kos, dan jasa di sekitar kampus. Pemilik usaha bisa mendaftarkan lapaknya, lalu membayar paket boost supaya lapaknya menonjol di peta dan muncul di atas daftar rekomendasi.

Status proyek: **Fase 0 sampai 5 selesai, ditambah sebagian Fase 6**. Peta interaktif, pencarian, filter kategori, CRUD lapak, unggah foto, boost berbayar lewat QRIS MiomiPay, panel admin, dan tema terang atau gelap sudah berjalan. Belum ada: deployment, tangkapan layar, studi kasus, dan akun demo publik.

## Masalah yang Dipecahkan

Pendatang seperti mahasiswa baru kesulitan menemukan tempat makan, kos, atau bengkel di sekitar kampus karena informasinya tersebar. Sebaliknya, pemilik usaha kecil jarang punya kanal digital sendiri. Ndekat menyatukan keduanya: peta untuk mencari, dan kanal sederhana untuk pemilik usaha tampil.

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
- MiomiPay (QRIS)
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
Pemilik -> Pilih paket -> Server buat tagihan QRIS -> Bayar di MiomiPay
      -> Halaman boost menanyakan status -> Boost aktif -> Marker emas + naik urutan
      -> Lewat tanggal berakhir -> Boost nonaktif
```

## Menjalankan Proyek

Butuh Node.js 20 atau lebih baru, dan PostgreSQL 14 atau lebih baru dengan ekstensi `cube` dan `earthdistance` aktif (keduanya bawaan contrib, tanpa PostGIS).

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
# lalu isi DATABASE_URL, NUXT_APP_SECRET, dan kunci MiomiPay di .env
npm run db:generate         # generate Prisma Client
npm run db:migrate          # buat tabel dan aktifkan ekstensi geospasial
npm run db:seed             # isi data contoh (opsional)
npm run dev                 # buka http://localhost:3000
```

Isi `.env` untuk pembayaran boost:

```
MIOMIPAY_SANDBOX_KEY=MP-SB-...
MIOMIPAY_WEBHOOK_SECRET=whsec_...
MIOMIPAY_BASE_URL=https://pg.miomidev.com/api/v1
MIOMIPAY_ENV=sandbox
```

Kunci diambil dari dashboard MiomiPay setelah mendaftar gratis di `https://pg.miomidev.com/register`. Bila kunci belum diisi, halaman boost menampilkan peringatan dan tidak mengirim permintaan ke MiomiPay.

Skrip lain: `npm run build`, `npm run lint`, `npm run format`, `npm run format:check`, `npm run typecheck`, `npm run db:studio`.

Foto lapak disimpan di `public/uploads` dan tidak masuk Git. Folder itu dibuat otomatis saat unggahan pertama. Karena `public` hanya disalin ke build sekali, ada rute `server/routes/uploads/[nama].get.ts` yang menyajikan berkas langsung dari disk.

### Menguji pembayaran tanpa ngrok

Boost aktif karena aplikasi **menanyakan status ke MiomiPay**, bukan menunggu webhook masuk. Permintaan itu keluar dari server ke internet, jadi berjalan di `localhost` tanpa tunnel.

1. Buka halaman boost sebuah lapak, pilih paket, tekan "Buat tagihan QRIS".
2. Salin tautan "Buka halaman pembayaran", atau salin nomor tagihan `MP-INV-...`.
3. Buka `https://pg.miomidev.com/sandbox/simulator`, tempel tautan atau nomor itu, lalu tekan "Bayar Sekarang".
4. Halaman boost menandai pembayaran dalam 5 detik, boost aktif, marker berubah emas.

Webhook `POST /api/payments/notification` tetap tersedia sebagai jalur cadangan untuk deployment yang punya alamat publik. Verifikasinya memakai HMAC-SHA256 dari isi mentah request dibandingkan header `X-MiomiPay-Signature`, dan baru berguna setelah aplikasi bisa dijangkau dari internet.

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
node scripts/uji-regresi.mjs     # 48 pemeriksaan alur utama
node scripts/uji-foto.mjs        # 36 pemeriksaan unggah foto
node scripts/uji-tema-seo.mjs    # 10 pemeriksaan tema dan SEO
node scripts/uji-miomipay.mjs    # 27 pemeriksaan pembayaran sampai boost aktif
node scripts/uji-admin.mjs       # pembatasan akses admin
```

`scripts/uji-miomipay.mjs` membuat tagihan sungguhan di sandbox MiomiPay, menandainya lunas lewat simulator, lalu memastikan boost aktif, idempoten, dan menolak pembelian kedua. Skrip itu butuh `MIOMIPAY_WEBHOOK_SECRET` di `.env`.

`scripts/uji-foto.mjs`, `scripts/uji-regresi.mjs`, dan `scripts/uji-miomipay.mjs` mengubah data, jadi jalankan pada basis data pengembangan. `scripts/bersih-foto.mjs` dan `scripts/bersih-pembayaran.mjs` mengembalikan data ke keadaan seed.

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
