# Lapak Peta

Peta interaktif untuk menemukan tempat makan, kos, dan jasa di sekitar kampus. Pemilik usaha bisa mendaftarkan lapaknya, lalu membayar paket boost supaya lapaknya menonjol di peta dan muncul di atas daftar rekomendasi.

Status proyek: **tahap perencanaan**. Dokumen desain, PRD, arsitektur, dan task list sudah tersusun. Kode aplikasi belum ditulis. Tangkapan layar dan tautan demo akan ditambahkan setelah aplikasi berjalan.

## Masalah yang Dipecahkan

Pendatang seperti mahasiswa baru kesulitan menemukan tempat makan, kos, atau bengkel di sekitar kampus karena informasinya tersebar. Sebaliknya, pemilik usaha kecil jarang punya kanal digital sendiri. Lapak Peta menyatukan keduanya: peta untuk mencari, dan kanal sederhana untuk pemilik usaha tampil.

## Fitur Rencana

- Peta interaktif dengan marker per kategori (kuliner, kos, bengkel, jasa lain).
- Filter kategori dan pencarian nama maupun pencarian "di sekitar saya".
- CRUD lapak oleh pemilik: nama, foto, jam buka, dan daftar menu atau layanan.
- Boost lapak berbayar lewat payment gateway: marker berubah emas dan lapak naik ke atas daftar.
- Verifikasi dan moderasi lapak oleh admin.

## Tumpukan Teknologi

- Nuxt 3, Vue 3, TypeScript
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

Belum tersedia. Langkah menjalankan akan diisi setelah aplikasi di-scaffold pada Fase 0 dan 1 (lihat [docs/04-task-list.md](docs/04-task-list.md)).

## Rencana Selanjutnya

- [ ] Scaffold proyek dan token desain
- [ ] Autentikasi dan CRUD lapak
- [ ] Peta dan pencarian
- [ ] Boost dan pembayaran
- [ ] Panel admin
- [ ] Deployment, tangkapan layar, dan studi kasus

## Lisensi

Belum ditentukan.
