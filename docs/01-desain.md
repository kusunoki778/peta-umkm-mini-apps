# 01 - Arah Desain

Dokumen ini adalah sumber arah visual (setara `DESIGN.md`). Semua keputusan UI nanti harus merujuk ke sini. Setiap pilihan diberi alasan singkat supaya bukan default yang diambil asal.

## Ringkasan

Produk ini pada dasarnya adalah **peta**. Peta bukan pelengkap halaman, tapi kanvas utamanya. Semua elemen lain (pencarian, filter, kartu lapak, badge boost) ada untuk melayani peta. Karena itu tata letak dibuat map-first, bukan landing page dengan peta kecil di tengah.

Karakter yang dituju: hangat dan dekat, seperti papan nama warung dan label harga di pasar. Bukan korporat, bukan SaaS gelap bergaya terminal.

## Design Read

> Reading this as: direktori berbasis lokasi untuk mahasiswa dan pemilik UMKM di Indonesia, dengan bahasa visual hangat map-centric, dial ENERGY 2 / RHYTHM 2 / MOTION 2.

## Tiga Dial

| Dial   | Nilai                                  | Alasan                                                                                                                         |
| ------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| ENERGY | 2 (balanced)                           | Produk publik untuk orang awam, bukan brand agresif. Cukup hidup lewat warna kategori dan marker, tidak berteriak.             |
| RHYTHM | 2 (konsisten dengan sedikit variasi)   | Halaman utama selalu peta. Variasi muncul di halaman detail, dashboard pemilik, dan panel admin yang berbentuk form dan tabel. |
| MOTION | 2 (transisi, scroll-reveal seperlunya) | Satu gerakan sengaja: halo berdenyut di marker boost. Sisanya tenang.                                                          |

## Nama Produk

Nama kerja: **Lapak Peta** (tagline: "Temukan lapak di sekitarmu"). Alternatif yang dipertimbangkan: Sekitar Kampus, PetaLapak.

Status: **belum final**. Wordmark sementara memakai teks "Lapak Peta" dalam tipografi brand. Belum ada logo final. Jangan menggambar logo atau ikon brand tanpa konfirmasi pemilik.

## Referensi dan Inspirasi

Referensi dipakai untuk belajar **pola interaksi**, bukan untuk meniru tampilan produk lain.

| Referensi                                            | Yang dipelajari                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Google Maps                                          | Hubungan peta dan panel daftar, penempatan kontrol zoom dan lokasi saya, kebiasaan pengguna pada peta. |
| Airbnb                                               | Pola peta di kiri dan kartu di kanan, serta cara kartu dan pin saling menyorot saat disorot.           |
| GoFood / GrabFood                                    | Kartu merchant, ikon kategori, susunan daftar rekomendasi.                                             |
| Foursquare                                           | Taksonomi kategori tempat.                                                                             |
| HappyCow                                             | Peta plus daftar untuk tempat lokal.                                                                   |
| Signage warung, spanduk pasar, label harga Indonesia | Warna berani, tipografi papan nama, bentuk label harga menjadi sumber motif identitas.                 |

## Identitas

Motif identitas yang diulang di seluruh produk: **label papan lapak**. Turunannya:

- Bentuk **label harga** (persegi dengan sudut terpotong kecil di satu sisi) dipakai untuk chip kategori dan badge status boost.
- Perlakuan **stiker** untuk lapak yang di-boost ("Lapak Unggulan"), seperti stiker promo pada spanduk, jadi penanda komersial terasa wajar dan bukan iklan yang menyamar.
- Satu aksen warna (emas) yang hanya muncul berkaitan dengan boost. Ini yang membuat mata tahu "yang ini berbayar" tanpa membaca teks.

Alasan motif ini dipakai: langsung terkait isi produk (lapak UMKM), membedakan dari template SaaS, dan memberi penanda boost sebuah bahasa visual, bukan sekadar warna berbeda.

## Palet Warna

Prinsip: 2 warna inti (hijau daun dan netral kertas) + 1 aksen (emas untuk boost). Warna kategori adalah **encoding data**, bukan dekorasi, jadi jumlahnya boleh lebih dari tiga dengan alasan: warna itu hanya muncul di pin peta, legenda, dan chip filter.

### Netral

| Token       | Hex (light) | Hex (dark) | Pemakaian     | Alasan                                                 |
| ----------- | ----------- | ---------- | ------------- | ------------------------------------------------------ |
| `--paper`   | `#F7F4EF`   | `#15130F`  | Latar halaman | Putih hangat seperti kertas, bukan putih dingin steri. |
| `--surface` | `#FFFFFF`   | `#1F1C17`  | Kartu, panel  | Memisahkan kartu dari latar tanpa bayangan besar.      |
| `--ink`     | `#1C1917`   | `#F5F2EC`  | Teks utama    | Hitam hangat, kontras tinggi terhadap paper.           |
| `--muted`   | `#6B6459`   | `#A8A093`  | Teks sekunder | Abu kecokelatan, senada dengan netral hangat.          |
| `--border`  | `#E4DED4`   | `#332E26`  | Garis tepi    | Pemisah halus, bukan garis tebal abu.                  |

### Inti dan aksen

| Token       | Hex       | Pemakaian                                        | Alasan                                                                                    |
| ----------- | --------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `--primary` | `#0F6B4F` | Aksi utama, tombol, tautan aktif, marker default | Hijau daun terasa lokal dan tenang, bukan biru korporat yang jadi default AI.             |
| `--accent`  | `#E8A317` | Boost, badge Lapak Unggulan, marker emas         | Emas secara alami terbaca sebagai "premium", jadi status berbayar tidak perlu dijelaskan. |
| `--danger`  | `#C2412D` | Hapus, error                                     | Merah bata hangat supaya senada, bukan merah terang.                                      |

### Warna kategori (encoding)

| Kategori  | Hex       | Alasan                                                |
| --------- | --------- | ----------------------------------------------------- |
| Kuliner   | `#E4572E` | Hangat dan menggugah, paling banyak isinya.           |
| Kos       | `#2E6BB0` | Biru tenang, membedakan jelas dari kategori lain.     |
| Bengkel   | `#5A6472` | Abu baja, mengikuti nuansa alat dan logam.            |
| Jasa lain | `#7A4FB5` | Ungu, kategori sisa yang tetap butuh penanda sendiri. |

Catatan: setiap pasangan teks dan latar wajib dicek kontrasnya (target WCAG AA: 4.5:1 untuk teks normal, 3:1 untuk teks besar) sebelum dipakai. Warna teks di atas pin dan chip harus diuji, jangan diasumsikan.

## Tipografi

| Peran                    | Typeface                      | Alasan                                                                                                                                                                                            |
| ------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Heading, brand, headline | **Fraunces** (serif variabel) | Karakter cetak dan papan nama, memberi kehangatan UMKM, dan sengaja menghindari pasangan sans default (Inter/Geist/Space Grotesk). Dipakai hemat: judul brand, judul seksi, headline empty state. |
| Body, UI, label peta     | **Plus Jakarta Sans**         | Typeface buatan Indonesia, humanis, legibility tinggi untuk UI padat seperti daftar dan chip peta.                                                                                                |

Skala tipe: `display` 32/40, `h1` 24/32, `h2` 20/28, `body` 15/24, `label` 13/18, `caption` 12/16. Beban heading 600, body 400 sampai 500, angka harga memakai angka tabular.

## Ikonografi

Ikon dipilih karena relevansi isi, bukan karena setnya populer. Gaya: garis tebal 2px dengan ujung membulat, konsisten satu keluarga.

| Konteks     | Ikon                       |
| ----------- | -------------------------- |
| Kuliner     | sendok dan garpu           |
| Kos         | kasur                      |
| Bengkel     | kunci inggris              |
| Jasa lain   | kotak alat                 |
| Lokasi saya | bidik                      |
| Rute        | arah belok                 |
| Boost       | label harga dengan bintang |

Alasan tiap ikon harus jelas dalam satu baris saat dipakai. Kalau tidak ada ikon yang relevan, label teks lebih baik daripada ikon dekoratif.

## Marker Peta

Marker adalah elemen paling penting di produk ini, jadi diperlakukan sebagai komponen inti.

- **Marker biasa**: pin bundar berisi glyph putih, warna sesuai kategori, anchor di bawah tengah. Sedikit bayangan hanya saat di-hover untuk menandakan bisa diklik.
- **Marker boost**: pin emas dengan cincin luar. Cincin berdenyut pelan dengan halo.
- **Marker terpilih**: diperbesar 1.15x dan diberi bayangan elevasi sebagai satu-satunya penanda elevasi di peta.

Aturan gerak (MOTION): denyut hanya di marker boost. Alasannya, boost adalah **status nyata** (pemilik sudah membayar dan ingin lebih terlihat), jadi mengarahkan perhatian ke marker itu memang tujuannya. Ini satu-satunya motion accent di peta, bukan denyut di semua marker. Saat `prefers-reduced-motion: reduce`, cincin tampil statis tanpa denyut.

Aturan z-index: marker boost selalu di atas marker biasa; marker terpilih paling atas. Saat pin terlalu rapat, marker biasa masuk cluster berisi angka, sedangkan marker boost dikeluarkan dari cluster (selalu tampil sendiri) supaya status berbayarnya tidak tersembunyi.

## Tata Letak

### Desktop

```
+---------------------------------------------------------------+
| [Lapak Peta]        [cari nama tempat.....]      [Masuk] [+]  |
+------------------------------------+--------------------------+
|                                    |  [Kuliner][Kos][Bengkel] |
|                                    |  ----------------------  |
|             PETA                   |  | (foto) Nama lapak  |  |
|        (kanvas utama,              |  | jarak . jam buka   |  |
|         pin kategori,              |  | [Lapak Unggulan]   |  |
|         pin emas boost)            |  ----------------------  |
|                                    |  | (foto) Nama lapak  |  |
|   [+][-]   (bidik lokasi saya)     |  ----------------------  |
|                                    |  | (foto) Nama lapak  |  |
+------------------------------------+--------------------------+
```

Peta mengisi sekitar 62% lebar, panel daftar 38%. Header tipis mengambang di atas peta.

### Mobile

```
+---------------------------+
| [cari tempat.......] [o]  |
+---------------------------+
|                           |
|          PETA             |
|     pin kategori,         |
|     pin emas boost        |
|                           |
|  (bidik lokasi saya)      |
+===========================+  <- bottom sheet bisa digeser
| [Kuliner][Kos][Bengkel]   |
| ------------------------- |
| | (foto) Nama lapak     | |
| | jarak . jam buka      | |
| ------------------------- |
+---------------------------+
                        (+) <- tombol Daftarkan Lapak
```

Peta penuh layar, daftar memakai bottom sheet yang bisa digeser naik turun. Target sentuh minimal 44px. Tombol "Daftarkan Lapak" sebagai tombol mengambang.

Breakpoint: mobile (<768px) peta penuh plus bottom sheet; tablet (768px sampai 1023px) peta dengan panel menempel; desktop (>=1024px) split peta dan panel.

## Komponen Inti

SearchBar, FilterChip, CategoryLegend, MapCanvas, MapMarker, MerchantCard, MerchantDetailSheet, BoostSticker, BoostCheckout, PriceTag, EmptyState, LoadingSkeleton, Toast, ThemeToggle, AdminTable.

## Keadaan (States)

Setiap tampilan data wajib punya tiga keadaan (R-27).

| Keadaan                     | Tampilan                                                       | Contoh teks                                                                                 |
| --------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Loading                     | Skeleton 4 kartu, peta menampilkan indikator memuat            | "Memuat lapak di sekitarmu"                                                                 |
| Empty (belum ada data)      | Ilustrasi sederhana dari bentuk label papan lapak, satu ajakan | "Belum ada lapak di area ini. Jadi yang pertama mendaftar." dengan tombol "Daftarkan Lapak" |
| Empty (hasil filter kosong) | Sama tapi aksi berbeda                                         | "Tidak ada lapak untuk filter ini. Coba hapus filter." dengan tombol "Hapus filter"         |
| Error                       | Pesan spesifik dan aksi coba lagi                              | "Gagal memuat peta. Periksa koneksi lalu coba lagi."                                        |
| Geolocation ditolak         | Penjelasan, bukan error menakutkan                             | "Izin lokasi dimatikan. Kamu tetap bisa jelajah peta manual."                               |

Kalimatnya harus menyebutkan sebab dan aksi berikutnya, bukan sekadar "No data".

## Copywriting dan Nada

Bahasa Indonesia, santai tapi rapi. Kalimat pendek. Tidak ada klaim tanpa bukti.

Tombol memakai kata kerja yang spesifik:

| Perlu dihindari | Dipakai                    |
| --------------- | -------------------------- |
| Get Started     | Daftarkan Lapak            |
| Learn More      | Lihat menu dan jam buka    |
| Try Now         | Coba peta                  |
| Boost / Upgrade | Boost Lapak Ini (Rp25.000) |

Contoh teks lain: toast sukses "Lapak kamu sudah tayang di peta."; toast boost aktif "Boost aktif selama 30 hari. Markermu kini disorot."; error form "Foto terlalu besar, maksimal 2 MB."

Larangan teks: tanda pisah panjang (em dash), kata seperti "seamless", "revolutionary", "next generation", "AI powered", dan emoji dekoratif di dalam UI.

## Aksesibilitas

- Kontras teks memenuhi WCAG AA.
- Target sentuh minimal 44px, jarak antar chip filter memadai.
- Peta tidak bisa diakses keyboard secara native, jadi panel daftar adalah jalur akses utama: seluruh lapak bisa ditemukan dan dibuka lewat daftar (form, tombol, tautan) dengan Tab, Enter, dan Escape.
- Setiap marker adalah elemen ber-label (nama tempat) supaya pembaca layar tidak menemukan pin tanpa makna.
- Indikator fokus terlihat jelas, tidak pernah `outline: none` tanpa pengganti.
- `prefers-reduced-motion: reduce` mematikan denyut marker dan transisi sheet.

## Motion

- Halo berdenyut pada marker boost (satu-satunya gerakan kontinu, dengan alasan status).
- Sheet daftar di mobile digeser dengan transisi pendek.
- Chip filter berubah state dengan transisi warna singkat.
- Pin muncul sekali saat peta selesai memuat (bukan animasi berulang).

Tidak ada gerakan tanpa sebab. Kalau ragu, biarkan diam.

## Keputusan Anti-Slop (yang sengaja tidak dilakukan)

- Tidak ada gradien biru ke ungu atau orb bercahaya di latar.
- Tidak ada glassmorphism di navbar, kartu, modal, dan sidebar sekaligus.
- Tidak ada pill di setiap elemen; radius dipakai sebagai alat hierarki.
- Tidak ada bayangan besar di semua komponen.
- Tidak ada glow di mana-mana; satu aksen (emas) hanya untuk boost.
- Tidak ada emoji dekoratif di judul, tombol, atau bullet.
- Tidak ada badge "AI Powered" / "Beta" tanpa fungsi.
- Tidak ada skeleton yang dipajang sebagai "screenshot produk".
- Tidak ada angka atau testimoni palsu.
- Tidak ada denyut tanpa sebab; denyut hanya pada marker boost.
- Tidak memakai Inter/Geist tanpa alasan; dipilih Plus Jakarta Sans dan Fraunces dengan alasan yang ditulis.

## Placeholder yang Jujur

- Logo: wordmark teks "Lapak Peta" dulu. Belum digambar sebagai logo final.
- Foto lapak: placeholder abu dengan inisial nama lapak, bukan foto orang hasil karangan.
- Statistik: tidak ditampilkan sampai ada data nyata, atau diberi label `[DATA NYATA]`.
