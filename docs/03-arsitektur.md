# 03 - Arsitektur

## 1. Gambaran Sistem

Aplikasi satu repo dengan Nuxt 4. UI berjalan di browser, logika server (API, webhook, akses basis data) berjalan di server Nitro di dalam proyek Nuxt yang sama.

```
+-------------------------------------------------------------+
|  Browser (Vue 3 + Tailwind)                                 |
|  - Peta Leaflet, kartu lapak, form, panel admin             |
+------------------------------+------------------------------+
                               | HTTP (JSON, cookie sesi)
                               v
+-------------------------------------------------------------+
|  Server Nitro (di dalam Nuxt 4)                             |
|  - server/api/*  (endpoint REST)                            |
|  - Autentikasi peran, validasi input                        |
|  - Akses basis data lewat Prisma                            |
|  - Webhook Midtrans                                         |
+--------+------------------------------+---------------------+
         |                              |
         v                              v
+-------------------+          +---------------------------+
| PostgreSQL        |          | Midtrans (Snap + Core)    |
| + PostGIS         |          | sandbox / produksi        |
+-------------------+          +---------------------------+
         ^
         | tile gambar
+-------------------+
| Tile OSM (klien)  |
+-------------------+
```

## 2. Stack

| Lapis       | Pilihan                                                   | Alasan                                                                                                                           |
| ----------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Framework   | Nuxt 4                                                    | Satu proyek untuk UI dan server API, SSR untuk SEO halaman detail lapak, TypeScript menyeluruh.                                  |
| Bahasa      | TypeScript                                                | Tipe kuat dari basis data sampai UI, cocok untuk portofolio yang rapi.                                                           |
| UI          | Vue 3 + Tailwind CSS                                      | Komponen reaktif untuk peta dan filter, Tailwind mempercepat konsistensi desain.                                                 |
| Peta        | Leaflet + OpenStreetMap                                   | Gratis, tanpa kunci API, banyak referensi.                                                                                       |
| Basis data  | PostgreSQL + PostGIS                                      | PostGIS menangani pencarian radius dan pengurutan jarak dengan benar.                                                            |
| ORM         | Prisma                                                    | Umum dipakai, migrasi jelas; query geospasial dilakukan lewat SQL mentah. Alternatif: Drizzle (dukungan PostGIS lebih langsung). |
| Autentikasi | nuxt-auth-utils (cookie sesi) atau sidebase/nuxt-auth     | nuxt-auth-utils ringan dan cukup untuk kredensial dan peran. Alternatif: Auth.js bila butuh penyedia login sosial.               |
| Pembayaran  | Midtrans Snap                                             | Sesuai kebutuhan pembayaran lokal, sudah dipakai di proyek pelatihan.                                                            |
| Validasi    | Zod                                                       | Validasi skema di server dan di klien dari satu sumber.                                                                          |
| Unggah foto | Lokal saat pengembangan, S3 atau Cloudinary saat produksi | Sederhana saat mulai, bisa naik ke penyimpanan objek.                                                                            |

## 3. Struktur Folder

```
peta-umkm-mini-apps/
├── app/                     (root aplikasi Nuxt 4)
│   ├── app.vue
│   ├── assets/
│   │   └── css/main.css     (token desain Tailwind v4)
│   ├── components/
│   │   ├── map/            (MapCanvas, MapMarker, MarkerCluster)
│   │   ├── business/       (BusinessCard, BusinessForm, BusinessDetail)
│   │   ├── boost/          (BoostSticker, BoostCheckout)
│   │   └── ui/             (Button, Chip, Sheet, EmptyState, Toast)
│   ├── composables/
│   │   ├── useBusinesses.ts
│   │   ├── useMap.ts
│   │   └── useBoost.ts
│   ├── layouts/
│   │   ├── default.vue
│   │   ├── dashboard.vue
│   │   └── admin.vue
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── admin.ts
│   ├── pages/
│   │   ├── index.vue            (peta utama)
│   │   ├── lapak/[id].vue       (detail lapak)
│   │   ├── masuk.vue
│   │   ├── daftar.vue
│   │   ├── kelola/index.vue     (dashboard pemilik)
│   │   ├── kelola/lapak/baru.vue
│   │   ├── kelola/lapak/[id].vue
│   │   └── admin/
│   │       ├── index.vue
│   │       └── transaksi.vue
│   ├── stores/
│   │   ├── filters.ts
│   │   └── session.ts
│   └── generated/prisma/    (client Prisma hasil generate, tidak di-commit)
├── server/                  (endpoint Nitro, tetap di root proyek)
│   ├── api/
│   │   ├── auth/
│   │   ├── businesses/
│   │   ├── categories/
│   │   ├── boosts/
│   │   ├── payments/
│   │   └── admin/
│   ├── middleware/
│   └── utils/
│       ├── prisma.ts
│       ├── auth.ts
│       ├── validation.ts
│       └── geo.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   └── uploads/
├── docs/
├── nuxt.config.ts
├── prisma7.config.ts        (konfigurasi Prisma 7)
└── eslint.config.mjs
```

Catatan versi: proyek memakai Nuxt 4, jadi halaman, komponen, layout, dan composable berada di dalam `app/`, sementara endpoint `server/` tetap di root. Tailwind CSS v4 memakai pendekatan CSS-first, sehingga tidak ada `tailwind.config.ts`: token desain ditulis di `app/assets/css/main.css` lewat `@theme`.

## 4. Model Data

Entitas utama dan relasinya.

```
users (1) ----< businesses (n)          satu pemilik punya banyak lapak
users (1) ----< boosts (n)              pemilik punya riwayat boost
businesses (1) ----< photos (n)
businesses (1) ----< items (n)          menu atau layanan
businesses (1) ----< opening_hours (n)
businesses (1) ----< boosts (n)
categories (1) ----< businesses (n)
payments (1) ----  boosts (1)
reviews (n) >---- businesses (1)        (v1)
favorites (n) >---- users, businesses   (v1)
reports (n) >---- businesses            (v1)
```

### Tabel utama

| Tabel            | Kolom kunci                                                                                                                                                                           | Catatan                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `users`          | id, name, email (unik), password_hash, role (`owner` atau `admin`), created_at                                                                                                        | Kata sandi di-hash.                                         |
| `businesses`     | id, owner_id, name, slug, category_id, description, address, location `geography(Point,4326)`, status (`pending`, `live`, `rejected`, `inactive`), created_at, updated_at, deleted_at | `location` memakai PostGIS. `deleted_at` untuk hapus lunak. |
| `photos`         | id, business_id, url, sort_order                                                                                                                                                      |                                                             |
| `items`          | id, business_id, name, price, sort_order                                                                                                                                              | Menu atau layanan.                                          |
| `opening_hours`  | id, business_id, day (0 sampai 6), open_time, close_time, is_closed                                                                                                                   |                                                             |
| `categories`     | id, name, slug, color, icon                                                                                                                                                           | Warna mengikuti palet kategori di dokumen desain.           |
| `boost_packages` | id, name, duration_days, price                                                                                                                                                        | Data, bukan kode.                                           |
| `boosts`         | id, business_id, package_id, user_id, starts_at, ends_at, status (`pending`, `active`, `expired`, `failed`)                                                                           | Satu boost aktif per lapak.                                 |
| `payments`       | id, boost_id, order_id (unik), gross_amount, status (`pending`, `settlement`, `expire`, `deny`, `cancel`), payment_type, raw_response (JSONB), created_at                             | `order_id` untuk Midtrans.                                  |

### Indeks penting

- GiST pada `businesses.location` untuk query radius.
- Indeks biasa pada `businesses.category_id`, `businesses.status`, `boosts.ends_at`.
- Indeks unik pada `payments.order_id`.

## 5. Query Geospasial (PostGIS)

Kolom lokasi memakai tipe `geography(Point,4326)` supaya perhitungan jarak langsung dalam meter.

Aktifkan ekstensi:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Cari dalam radius dan urutkan dari terdekat:

```sql
SELECT b.*,
       ST_Distance(b.location, ST_MakePoint($lng, $lat)::geography) AS distance_m
FROM businesses b
WHERE b.status = 'live'
  AND b.deleted_at IS NULL
  AND ST_DWithin(b.location, ST_MakePoint($lng, $lat)::geography, $radius_m)
ORDER BY distance_m ASC;
```

Urutan daftar rekomendasi (boost lebih dulu, lalu jarak):

```sql
SELECT b.*,
       EXISTS (
         SELECT 1 FROM boosts bo
         WHERE bo.business_id = b.id
           AND bo.status = 'active'
           AND bo.ends_at > NOW()
       ) AS is_boosted,
       ST_Distance(b.location, ST_MakePoint($lng, $lat)::geography) AS distance_m
FROM businesses b
WHERE b.status = 'live' AND b.deleted_at IS NULL
ORDER BY is_boosted DESC, distance_m ASC;
```

Fallback bila PostGIS belum tersedia: simpan `lat` dan `lng` sebagai kolom biasa dan hitung jarak dengan rumus Haversine di SQL atau di aplikasi. Ini hanya jaring pengaman, bukan jalur utama.

## 6. Rancangan API

Endpoint REST lewat `server/api`. Semua respons JSON. Validasi input dengan Zod.

| Metode | Endpoint                           | Akses                         | Keterangan                                                            |
| ------ | ---------------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| POST   | `/api/auth/register`               | publik                        | Daftar akun pemilik.                                                  |
| POST   | `/api/auth/login`                  | publik                        | Masuk, membuat sesi.                                                  |
| POST   | `/api/auth/logout`                 | masuk                         | Keluar.                                                               |
| GET    | `/api/businesses`                  | publik                        | Daftar lapak. Query: `q`, `category`, `lat`, `lng`, `radius`, `page`. |
| GET    | `/api/businesses/:id`              | publik                        | Detail lapak.                                                         |
| POST   | `/api/businesses`                  | pemilik                       | Tambah lapak.                                                         |
| PATCH  | `/api/businesses/:id`              | pemilik pemiliknya atau admin | Ubah lapak.                                                           |
| DELETE | `/api/businesses/:id`              | pemilik pemiliknya atau admin | Hapus lunak.                                                          |
| POST   | `/api/businesses/:id/photos`       | pemilik                       | Unggah foto (multipart, `foto` dan `alt`).                            |
| DELETE | `/api/photos/:photoId`             | pemilik pemiliknya            | Hapus foto beserta berkasnya.                                         |
| GET    | `/api/categories`                  | publik                        | Daftar kategori.                                                      |
| GET    | `/api/boost-packages`              | publik                        | Daftar paket boost.                                                   |
| POST   | `/api/boosts`                      | pemilik                       | Buat transaksi boost dan Snap token.                                  |
| GET    | `/api/payments/config`             | publik                        | Status kesiapan kunci Midtrans (tanpa membocorkan nilainya).          |
| POST   | `/api/payments/notification`       | Midtrans                      | Webhook pembayaran. Verifikasi tanda tangan.                          |
| GET    | `/api/boosts/mine`                 | pemilik                       | Riwayat boost saya.                                                   |
| GET    | `/api/admin/businesses`            | admin                         | Daftar lapak untuk moderasi.                                          |
| PATCH  | `/api/admin/businesses/:id/status` | admin                         | Setujui, tolak, atau nonaktifkan.                                     |
| GET    | `/api/admin/payments`              | admin                         | Daftar transaksi.                                                     |

Contoh bentuk respons daftar:

```json
{
  "data": [
    {
      "id": 12,
      "name": "Warung Kopi Budi",
      "category": "kuliner",
      "isBoosted": true,
      "distanceM": 340,
      "location": { "lat": -6.9731, "lng": 107.6303 }
    }
  ],
  "meta": { "page": 1, "total": 48 }
}
```

## 7. Autentikasi dan Otorisasi

- Kredensial: surel dan kata sandi, di-hash dengan bcrypt atau argon2.
- Sesi: cookie terenkripsi berisi `userId` dan `role`.
- Guard rute: middleware `auth` untuk halaman yang butuh masuk, middleware `admin` untuk halaman admin.
- Pembatasan data: setiap perubahan dan penghapusan lapak diperiksa agar `owner_id` cocok dengan pengguna yang masuk, terkecuali admin.

## 8. Peta (Leaflet)

- Peta dirender hanya di klien (komponen `<ClientOnly>` dan impor dinamis), karena Leaflet butuh DOM.
- Tile layer memakai OpenStreetMap dengan atribusi yang benar.
- Marker dibuat dari `divIcon` HTML supaya warna kategori dan gaya emas boost bisa ditata dengan Tailwind dan CSS.
- Pengelompokan marker memakai plugin markercluster; marker boost dikeluarkan dari cluster.
- Pencarian di sekitar memakai `navigator.geolocation` dengan penanganan izin ditolak.

## 9. Pembayaran (Midtrans)

1. Pemilik memilih paket. Server membuat `order_id` unik dan menyimpan baris `payments` serta `boosts` berstatus `pending`.
2. Server memanggil Snap untuk membuat token, lalu mengirim token ke klien. Endpoint yang benar adalah `POST /snap/v1/transactions` (`app.sandbox.midtrans.com` untuk uji, `app.midtrans.com` untuk produksi). Path `/snap/v1/token` tidak ada dan akan menjawab 404.
3. Klien memanggil `snap.pay(token)`.
4. Midtrans mengirim webhook ke `/api/payments/notification`.
5. Server memverifikasi tanda tangan: SHA-512 dari `order_id + status_code + gross_amount + server_key`.
6. Bila status `settlement` atau `capture`, server mengaktifkan boost: `status = 'active'`, `starts_at = now`, `ends_at = now + duration_days`.
7. Proses dibuat idempoten: `order_id` yang sama tidak mengaktifkan boost dua kali.
8. Pengecekan status transaksi ke Midtrans disediakan sebagai cadangan bila webhook tidak sampai.

Kunci server hanya dipakai di server, tidak pernah dikirim ke klien. Kunci klien boleh dipakai di peramban untuk Snap.

Izin Midtrans yang dibutuhkan untuk alur ini cukup satu: **Snap Checkout `Write`**. Izin Core API sengaja dibiarkan `None`, sehingga memanggil `GET /v2/<order_id>/status` akan dijawab `403 Access denied`. Karena itu pengecekan status cadangan pada poin 8 belum bisa dipakai selama izin itu belum dinyalakan; webhook menjadi jalur aktivasi boost yang sebenarnya. Halaman `/api/payments/config` mengembalikan status kesiapan kunci (terisi atau tidak, sandbox atau produksi) tanpa membocorkan nilainya, dan halaman boost memakainya untuk menampilkan peringatan yang jelas alih-alih gagal senyap.

Dua jebakan yang sudah ditemui dan harus dijaga:

- Parameter nama rute: semua berkas di `server/api/businesses/` memakai satu nama parameter `:key` yang menerima id maupun slug. Mencampur `[id]` dan `[slug]` di posisi segmen yang sama membuat router Nitro gagal mencocokkan rute bersarang, dan gejalanya menyesatkan: request jatuh ke renderer Vue dengan 404 halaman, bukan 404 API.
- Rute halaman boost berada di `app/pages/kelola/boost/[slug].vue` (URL `/kelola/boost/<slug>`). Versi lama, `app/pages/kelola/[slug]/boost.vue`, tidak pernah dirender karena kalah prioritas oleh `kelola/[slug].vue`; halaman boost tampak "kosong" padahal yang terbuka adalah halaman kelola lapak.

## 10. Unggah Foto

- Terima `multipart/form-data` di `POST /api/businesses/:key/photos`, field `foto` dan `alt` (opsional).
- Batas: 6 foto per lapak, 5 MB per berkas, format JPG, PNG, atau WebP.
- Jenis berkas diperiksa dari isinya lewat Sharp, bukan dari nama berkas atau header yang dikirim klien. Berkas yang isinya bukan gambar dijawab `422`, bukan `500`.
- Setiap unggahan diperkecil menjadi tiga varian WebP (`kartu` 480 px, `detail` 960 px, `besar` 1440 px) dengan `withoutEnlargement`, sehingga foto kecil tidak dipaksa membesar dan jadi kabur.
- Nama berkas acak berbasis `Date.now()` dan UUID, memuat id acak yang tidak pernah dipakai ulang. Karena itu berkas boleh di-cache lama oleh peramban.
- Pengembangan: disimpan di `public/uploads`, yang tidak masuk Git.
- **Penyajian berkas:** folder `public` hanya disalin ke `.output/public` saat build, sehingga foto yang diunggah setelah build tidak akan tersaji oleh penyaji statis Nitro. Karena itu ada rute `server/routes/uploads/[nama].get.ts` yang membaca langsung dari disk. Rute ini juga menolak nama berkas yang tidak cocok pola `^[a-zA-Z0-9-]+\.webp$`, supaya tidak bisa dipakai keluar dari folder unggahan.
- Produksi: ganti ke penyimpanan objek (S3 atau Cloudinary). Yang perlu diubah hanya `server/utils/foto.ts` dan rute penyajiannya, karena kolom `business_photos.url` hanya menyimpan URL.

## 11. Keamanan

- Validasi semua input dengan Zod di batas server.
- Batasi laju permintaan pada endpoint autentikasi dan pencarian.
- Cookie sesi `httpOnly`, `secure`, dan `sameSite`.
- Perlindungan CSRF untuk permintaan yang mengubah data.
- Webhook hanya menerima permintaan dengan tanda tangan valid.
- Jangan menampilkan data kontak pribadi pemilik di halaman publik.
- Pesan error tidak membocorkan detail basis data.

## 12. Performa

- Pencarian memakai jeda (debounce) sebelum memanggil API.
- Daftar memuat bertahap (paginasi atau pemuatan saat menggulir).
- Peta dan plugin marker dimuat hanya di klien.
- Kategori dan paket boost di-cache karena jarang berubah.
- Halaman detail lapak di-render di server untuk SEO dan muat awal yang cepat.
- Batasi jumlah marker yang dirender sekaligus dengan clustering.
- Foto lapak memakai tiga varian ukuran dan atribut `srcset`, sehingga kartu daftar tidak mengunduh gambar 960 px untuk kotak 56 px.

## 12a. Tema Terang dan Gelap

- Kelas `.dark` pada `<html>` mengubah nilai token warna di `main.css`. Komponen tidak memakai warna gelap terpisah, jadi satu set kelas berlaku untuk dua tema.
- Pilihan disimpan di `localStorage` dengan kunci `lapak-peta-tema`. Bila belum ada pilihan, tema mengikuti `prefers-color-scheme`.
- Skrip kecil di `app.head.script` dijalankan sebelum halaman digambar. Tanpa ini, pengguna mode gelap melihat kedip putih setiap memuat ulang.
- Komposabel `useTema()` memegang status dan tombol ganti tema ada di header.

## 12b. Format Kode

- ESLint memegang aturan kebenaran (`npm run lint`), Prettier memegang format (`npm run format`, `npm run format:check`).
- Aturan `vue/html-self-closing` diselaraskan dengan keluaran Prettier. Tanpa penyesuaian itu, `npm run format` dan `npm run lint` saling bertentangan pada `<input />` dan `<img />`.
- Prettier pernah memecah ekspresi `@click` yang berisi beberapa pernyataan menjadi beberapa baris yang tidak valid dan membuat build gagal. Karena itu rangkaian pernyataan di template dipindah ke fungsi di `<script setup>`.

## 13. Deployment dan Konfigurasi

Pilihan yang disarankan:

- Aplikasi: Vercel atau Netlify (dukungan Nitro), atau VPS dengan Docker.
- Basis data: Neon, Supabase, atau PostgreSQL lokal yang mendukung PostGIS.
- Penyimpanan foto: S3 atau Cloudinary saat produksi.

Contoh variabel lingkungan (`.env.example`):

```
DATABASE_URL="postgresql://user:pass@localhost:5432/lapak_peta"
SESSION_SECRET="ganti-dengan-kunci-acak-panjang"
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxx"
MIDTRANS_IS_PRODUCTION="false"
UPLOAD_DIR="public/uploads"
```

## 14. Keputusan Arsitektur

| Keputusan                                         | Alasan                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Nuxt 4 satu proyek, bukan dua aplikasi            | Mengurangi kerumitan CORS dan deploy, dan satu bahasa untuk seluruh kode.                         |
| PostGIS, bukan pencarian jarak di aplikasi        | Query radius dan urutan jarak lebih akurat dan cepat, serta menunjukkan kemampuan basis data.     |
| Prisma dengan SQL mentah untuk geospasial         | Prisma memudahkan CRUD dan migrasi; query PostGIS yang tidak didukung ditulis sebagai SQL mentah. |
| Gaya marker lewat `divIcon`                       | Membuat marker emas dan denyut boost bisa ditata dengan CSS yang sama seperti komponen lain.      |
| Pembayaran lewat webhook sebagai sumber kebenaran | Status pembayaran tidak boleh ditentukan dari sisi klien saja.                                    |
