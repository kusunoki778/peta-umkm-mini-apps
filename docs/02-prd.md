# 02 - PRD: Lapak Peta

Product Requirements Document. Nama produk kerja "Lapak Peta" belum final.

## 1. Ringkasan

Lapak Peta adalah aplikasi web berupa peta interaktif untuk menemukan tempat makan, kos, dan jasa di sekitar kampus. Pemilik usaha bisa mendaftarkan, mengubah, dan menghapus profil lapaknya, lalu membayar paket boost supaya lapaknya menonjol di peta dan muncul di atas daftar rekomendasi.

Nilai utamanya ada di dua hal: peta yang enak dipakai untuk mencari, dan jalur monetisasi yang jelas bagi pemilik usaha kecil.

## 2. Latar Belakang dan Masalah

- Pendatang seperti mahasiswa baru kesulitan menemukan tempat makan, kos, atau bengkel di sekitar kampus. Info biasanya tersebar di grup pesan, unggahan media sosial, atau mulut ke mulut, dan sulit dicari lagi.
- Pemilik usaha kecil jarang punya kanal digital sendiri. Mereka sulit terlihat dibanding usaha yang sudah punya akun resmi.
- Cara yang ada sekarang mencampur dua kebutuhan berbeda: mencari lokasi (butuh peta) dan mencari rekomendasi (butuh daftar). Aplikasi ini menyatukan keduanya.

Dokumen ini tidak menyertakan angka pasar atau jumlah pengguna karena belum ada data nyata. Angka apa pun akan datang dari hasil pengujian sendiri.

## 3. Tujuan dan Non-Tujuan

### Tujuan

- Pengguna bisa menemukan lapak di sekitar lokasinya dalam beberapa langkah.
- Pemilik usaha bisa mendaftarkan lapaknya sendiri tanpa bantuan teknis.
- Ada jalur pendapatan dari boost lapak lewat payment gateway.
- Menjadi proyek portofolio yang menunjukkan alur penuh: autentikasi, CRUD, geospasial, pembayaran, dan panel admin.

### Non-Tujuan (untuk sekarang)

- Bukan marketplace transaksi barang atau jasa. Pembayaran hanya untuk boost, bukan pembelian produk lapak.
- Bukan aplikasi pesan antar makanan.
- Bukan aplikasi chat antara pengguna dan pemilik.
- Belum ada aplikasi mobile native di tahap ini.

## 4. Persona dan Peran

Persona di bawah adalah asumsi desain untuk memandu keputusan, bukan orang nyata.

| Persona                  | Peran sistem                     | Yang dibutuhkan                                                         |
| ------------------------ | -------------------------------- | ----------------------------------------------------------------------- |
| Nadia, mahasiswa         | Pengguna umum (bisa tanpa login) | Cari makan atau kos dekat kampus dengan cepat, lihat jam buka dan jarak |
| Pak Budi, pemilik warung | Pemilik lapak (login)            | Daftarkan lapak, atur jam buka dan menu, dorong lapak supaya terlihat   |
| Rina, pengelola platform | Admin (login)                    | Verifikasi lapak baru, moderasi laporan, lihat transaksi boost          |

## 5. Lingkup Bertingkat

### MVP (harus ada)

- Login dan peran pemilik serta admin.
- CRUD lapak oleh pemilik, termasuk unggah foto, jam buka, dan daftar menu atau layanan.
- Peta menampilkan semua lapak dengan filter kategori.
- Pencarian nama lapak dan pencarian "di sekitar saya".
- Halaman detail lapak.
- Boost lapak: pilih paket, bayar lewat QRIS MiomiPay, marker berubah emas dan naik ke atas daftar.
- Verifikasi lapak baru oleh admin.

### v1 (segera setelah MVP)

- Perpanjangan dan riwayat boost.
- Favorit lapak.
- Ulasan dan rating dari pengguna (rating tidak dijual, lihat Aturan Bisnis).
- Panel admin untuk moderasi laporan.
- SEO halaman detail lapak.

### v2 (kalau ada waktu)

- Rute ke lapak (buka aplikasi peta).
- Notifikasi kedaluwarsa boost lewat surel.
- Statistik kunjungan lapak untuk pemilik.
- Multi-kota atau multi-kampus.

### Di luar lingkup

- Aplikasi mobile native, pesan antar, chat, pembelian produk.

## 6. User Stories dan Kriteria Penerimaan

### Autentikasi dan Akun

**US-01. Daftar akun pemilik.** Sebagai calon pemilik lapak, saya ingin mendaftar dengan surel dan kata sandi, supaya bisa mengelola lapak saya.

- Diterima bila: pendaftaran menolak surel yang sudah terpakai, kata sandi minimal 8 karakter, dan akun baru otomatis berperan "pemilik".
- Diterima bila: kata sandi disimpan dalam bentuk hash, bukan teks biasa.

**US-02. Masuk dan keluar.** Sebagai pemilik atau admin, saya ingin masuk dan keluar, supaya sesi saya aman.

- Diterima bila: setelah masuk, sesi bertahan dan peran dikenali; setelah keluar, halaman terlindungi tidak bisa dibuka.

**US-03. Jelajah tanpa login.** Sebagai pengguna umum, saya ingin melihat peta dan detail lapak tanpa perlu akun.

- Diterima bila: halaman peta dan detail bisa dibuka tanpa login; aksi yang butuh akun (daftar lapak, boost) meminta login.

### CRUD Lapak

**US-04. Mendaftarkan lapak.** Sebagai pemilik, saya ingin menambah lapak baru, supaya usaha saya muncul di peta.

- Diterima bila: form meminta nama, kategori, alamat, titik lokasi di peta, jam buka, deskripsi, dan minimal satu foto.
- Diterima bila: titik lokasi bisa dipilih dengan menggeser pin atau memakai lokasi saya saat ini.
- Diterima bila: lapak baru berstatus "menunggu verifikasi" dan belum tampil di peta publik sampai admin menyetujui.

**US-05. Mengubah lapak.** Sebagai pemilik, saya ingin mengubah data lapak saya.

- Diterima bila: pemilik hanya bisa mengubah lapaknya sendiri; perubahan pada data penting memicu status "perlu tinjau ulang".

**US-06. Menghapus lapak.** Sebagai pemilik, saya ingin menghapus lapak saya.

- Diterima bila: penghapusan bersifat lunak (soft delete) supaya riwayat boost dan transaksi tetap aman; lapak hilang dari peta publik.

**US-07. Foto lapak.** Sebagai pemilik, saya ingin mengunggah beberapa foto.

- Diterima bila: tipe berkas dibatasi (JPG, PNG, WebP) dan ukuran dibatasi (mis. maksimal 2 MB per foto); foto otomatis dikecilkan sebelum disimpan.

**US-08. Menu atau layanan.** Sebagai pemilik, saya ingin menambahkan daftar menu atau layanan beserta harga.

- Diterima bila: setiap item punya nama dan harga opsional, bisa diubah urutannya, dan tampil di halaman detail.

### Peta dan Pencarian (GIS)

**US-09. Melihat semua lapak di peta.** Sebagai pengguna, saya ingin melihat semua titik lapak.

- Diterima bila: semua lapak terverifikasi tampil sebagai marker berwarna sesuai kategori; marker boost tampil dengan gaya emas.

**US-10. Filter kategori.** Sebagai pengguna, saya ingin menyaring berdasarkan kategori.

- Diterima bila: filter bisa dipilih lebih dari satu, peta dan daftar ikut berubah, dan jumlah hasil terlihat.

**US-11. Pencarian nama.** Sebagai pengguna, saya ingin mencari nama lapak.

- Diterima bila: pencarian menampilkan hasil saat mengetik (dengan jeda singkat), dan menyorot marker yang cocok.

**US-12. Pencarian di sekitar saya.** Sebagai pengguna, saya ingin mencari lapak di radius tertentu dari posisi saya.

- Diterima bila: aplikasi meminta izin lokasi; kalau ditolak, pengguna tetap bisa jelajah manual; hasil diurutkan dari yang terdekat.

**US-13. Detail lapak.** Sebagai pengguna, saya ingin membuka detail lapak.

- Diterima bila: detail menampilkan foto, deskripsi, jam buka, menu atau layanan, alamat, jarak, dan tombol "Buka rute".

### Boost dan Pembayaran

**US-14. Membeli boost.** Sebagai pemilik, saya ingin membeli paket boost.

- Diterima bila: tersedia beberapa paket dengan durasi berbeda, dan pembayaran memakai QRIS MiomiPay.

**US-15. Boost aktif.** Sebagai pemilik, saya ingin lapak saya menonjol setelah membayar.

- Diterima bila: setelah pembayaran terkonfirmasi (lewat webhook, bukan hanya dari sisi klien), marker berubah emas dan lapak naik ke atas daftar rekomendasi; boost punya tanggal berakhir.

**US-16. Boost kedaluwarsa.** Sebagai sistem, boost harus berhenti otomatis saat waktunya habis.

- Diterima bila: setelah tanggal berakhir, marker kembali normal dan urutan daftar kembali mengikuti aturan biasa; tidak ada boost yang tetap aktif tanpa pembayaran.

**US-17. Riwayat boost.** Sebagai pemilik, saya ingin melihat riwayat boost dan status pembayaran saya.

### Admin

**US-18. Verifikasi lapak.** Sebagai admin, saya ingin menyetujui atau menolak lapak baru.

- Diterima bila: ada daftar lapak menunggu verifikasi; admin bisa menyetujui, menolak dengan alasan, atau menandai perlu perbaikan.

**US-19. Moderasi.** Sebagai admin, saya ingin menonaktifkan lapak yang melanggar.

- Diterima bila: lapak nonaktif hilang dari peta publik dan pemilik melihat statusnya.

**US-20. Transaksi boost.** Sebagai admin, saya ingin melihat transaksi boost.

- Diterima bila: daftar menampilkan pemilik, lapak, paket, jumlah, status, dan tanggal; admin bisa mencocokkan transaksi yang gagal.

## 7. Kebutuhan Fungsional per Modul

### Akun dan peran

- Registrasi, login, logout, sesi.
- Peran: pemilik, admin, pengguna umum.

### Manajemen lapak

- CRUD lapak dengan status: menunggu verifikasi, tayang, ditolak, nonaktif.
- Unggah dan urutkan foto.
- Item menu atau layanan.
- Jam buka per hari.

### Peta dan pencarian

- Marker per lapak, warna per kategori.
- Filter kategori (multi-pilih).
- Pencarian nama dan pencarian radius.
- Legend atau chip kategori.

### Boost

- Paket boost (durasi dan harga).
- Pembuatan tagihan QRIS dan nomor referensinya.
- Webhook pembayaran dan aktivasi boost.
- Urutan daftar: boost aktif lebih dulu, lalu jarak atau relevansi.

### Admin

- Verifikasi dan moderasi lapak.
- Kelola kategori.
- Daftar dan pencocokan transaksi.

## 8. Kebutuhan Non-Fungsional

| Aspek          | Target                                                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Performa       | Peta terasa responsif saat digeser; daftar memuat bertahap; pencarian memakai jeda agar tidak membanjiri server.                       |
| Keamanan       | Kata sandi di-hash, kunci server tidak pernah dikirim ke klien, webhook diverifikasi tanda tangannya, akses data dibatasi per pemilik. |
| Aksesibilitas  | Kontras WCAG AA, target sentuh 44px, bisa dioperasikan keyboard melalui panel daftar, hormati `prefers-reduced-motion`.                |
| SEO            | Halaman detail lapak bisa di-render di server dan punya judul serta deskripsi.                                                         |
| Biaya          | Memakai layanan gratis untuk pengembangan: tile OpenStreetMap, MiomiPay sandbox, basis data lokal.                                     |
| Ketahanan data | Penghapusan lunak, cadangan basis data, migrasi tersimpan di repositori.                                                               |

## 9. Model Monetisasi (Paid Promote)

Boost adalah satu-satunya sumber pendapatan pada tahap ini. Boost tidak mengubah peringkat rating atau ulasan, hanya visibilitas di peta dan urutan daftar. Batas ini penting supaya kepercayaan pengguna terjaga.

| Paket   | Durasi  | Harga (contoh) | Yang didapat                                                    |
| ------- | ------- | -------------- | --------------------------------------------------------------- |
| Hemat   | 7 hari  | Rp15.000       | Marker emas, prioritas urutan                                   |
| Standar | 30 hari | Rp25.000       | Marker emas, prioritas urutan, badge "Lapak Unggulan"           |
| Pro     | 90 hari | Rp60.000       | Semua di atas, plus penempatan di daftar unggulan halaman depan |

Harga di atas contoh dari brief dan gampang diubah di basis data. Aturan paket disimpan sebagai data, bukan di dalam kode.

## 10. Alur Utama

### Alur pendaftaran lapak

1. Pemilik daftar akun, lalu masuk.
2. Isi form lapak, pilih titik lokasi, unggah foto.
3. Simpan. Status menjadi "menunggu verifikasi".
4. Admin memverifikasi.
5. Lapak tayang di peta.

### Alur boost

1. Pemilik membuka lapaknya, memilih "Boost Lapak Ini".
2. Pilih paket. Server membuat tagihan QRIS dan menyimpan nomor referensinya.
3. Pembeli memindai QRIS atau membuka halaman pembayaran MiomiPay.
4. Halaman boost menanyakan status pembayaran tiap 5 detik. Server meneruskannya ke MiomiPay, lalu memverifikasi hasilnya di sisi server.
5. Setelah lunas, boost diaktifkan dengan tanggal berakhir. Marker berubah emas dan urutan daftar berubah.
6. Saat tanggal berakhir, boost berhenti otomatis.

```
Pemilik -> Pilih paket -> Server buat tagihan QRIS -> Bayar di MiomiPay
      -> Webhook tervalidasi -> Boost aktif -> Marker emas + naik urutan
      -> Lewat tanggal berakhir -> Boost nonaktif
```

## 11. Metrik Sukses

Karena ini proyek portofolio, metrik yang dipakai adalah metrik teknis dan pengalaman yang bisa diukur sendiri, bukan klaim pasar.

- Jarak waktu dari buka halaman sampai peta dan daftar siap dipakai.
- Jumlah langkah dari masuk sampai lapak tayang.
- Persentase boost yang aktif setelah pembayaran berhasil (uji sandbox).
- Jumlah temuan aksesibilitas saat diaudit dengan keyboard.

Angka batasnya ditetapkan setelah pengukuran pertama, bukan dikarang sekarang.

## 12. Risiko dan Asumsi

| Risiko atau asumsi                      | Penanganan                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| PostGIS belum aktif di basis data       | Sediakan skrip migrasi untuk mengaktifkan ekstensi; sediakan fallback perhitungan jarak sederhana.                  |
| Kuota atau kebijakan tile OpenStreetMap | Siapkan penyedia tile cadangan dan atur atribusi dengan benar.                                                      |
| Webhook tidak sampai                    | Status ditanyakan langsung ke MiomiPay (polling), jadi aktivasi tidak bergantung pada webhook. Prosesnya idempoten. |
| Akurasi titik lokasi                    | Pemilik menggeser pin manual; pengguna melihat jarak sebagai perkiraan.                                             |
| Data awal kosong saat demo              | Sediakan skrip seed lapak contoh untuk keperluan demo.                                                              |

## 13. Aturan Bisnis

- Satu lapak hanya boleh punya satu boost aktif pada satu waktu.
- Urutan daftar: boost aktif lebih dulu, lalu jarak terdekat, lalu kelengkapan profil.
- Boost tidak memengaruhi rating atau ulasan.
- Lapak yang dihapus bersifat lunak; riwayat transaksi tetap tersimpan.
- Lapak baru tidak tampil sebelum diverifikasi admin.
- Larangan konten diterapkan lewat moderasi admin, bukan otomatis.
