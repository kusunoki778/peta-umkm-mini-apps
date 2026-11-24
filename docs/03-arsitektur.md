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
|  - Polling status pembayaran dan webhook cadangan             |
+--------+------------------------------+---------------------+
         |                              |
         v                              v
+-------------------+          +---------------------------+
| PostgreSQL        |          | MiomiPay (QRIS)           |
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
| Pembayaran  | MiomiPay (QRIS)                                           | Midtrans                                                                                                                         | Satu-satunya yang menyediakan simulator sandbox yang bisa menandai tagihan lunas dari localhost tanpa tunnel. |
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

| Tabel            | Kolom kunci                                                                                                                                                                                                             | Catatan                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `users`          | id, name, email (unik), password_hash, role (`owner` atau `admin`), created_at                                                                                                                                          | Kata sandi di-hash.                                         |
| `businesses`     | id, owner_id, name, slug, category_id, description, address, location `geography(Point,4326)`, status (`pending`, `live`, `rejected`, `inactive`), created_at, updated_at, deleted_at                                   | `location` memakai PostGIS. `deleted_at` untuk hapus lunak. |
| `photos`         | id, business_id, url, sort_order                                                                                                                                                                                        |                                                             |
| `items`          | id, business_id, name, price, sort_order                                                                                                                                                                                | Menu atau layanan.                                          |
| `opening_hours`  | id, business_id, day (0 sampai 6), open_time, close_time, is_closed                                                                                                                                                     |                                                             |
| `categories`     | id, name, slug, color, icon                                                                                                                                                                                             | Warna mengikuti palet kategori di dokumen desain.           |
| `boost_packages` | id, name, duration_days, price                                                                                                                                                                                          | Data, bukan kode.                                           |
| `boosts`         | id, business_id, package_id, user_id, starts_at, ends_at, status (`pending`, `active`, `expired`, `failed`)                                                                                                             | Satu boost aktif per lapak.                                 |
| `payments`       | id, boost_id, order_id (unik), amount, status (`pending`, `settled`, `expired`, `failed`, `refunded`), method, provider_ref (referensi MiomiPay), checkout_url, qr_image_url, raw_response (JSONB), paid_at, created_at | `order_id` dipakai sebagai `external_id` ke MiomiPay.       |

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
| POST   | `/api/boosts`                      | pemilik                       | Buat tagihan QRIS MiomiPay.                                           |
| GET    | `/api/payments/config`             | publik                        | Status kesiapan kunci MiomiPay (tanpa membocorkan nilainya).          |
| GET    | `/api/payments/:orderId/status`    | pemilik pemiliknya            | Tanya status ke MiomiPay, aktifkan boost bila lunas.                  |
| POST   | `/api/payments/notification`       | MiomiPay                      | Webhook cadangan. Verifikasi HMAC-SHA256.                             |
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

## 9. Pembayaran (MiomiPay)

1. Pemilik memilih paket. Server membuat `order_id` unik dan menyimpan baris `payments` serta `boosts` berstatus `pending`.
2. Server memanggil `POST /api/v1/payment/create` di MiomiPay, lalu menyimpan `reference`, `checkout_url`, dan `qr_image_url` di baris `payments`.
3. Halaman boost menampilkan gambar QRIS dan tautan halaman pembayaran MiomiPay.
4. Halaman boost menanyakan status tiap 5 detik lewat `GET /api/payments/:orderId/status`. Server meneruskannya ke `GET /api/v1/payment/:reference/status` di MiomiPay.
5. Bila status `PAID`, server mengaktifkan boost: `status = 'active'`, `starts_at = now`, `ends_at = now + duration_days`.
6. Webhook `POST /api/payments/notification` tetap tersedia sebagai jalur cadangan untuk deployment yang punya alamat publik, dengan verifikasi HMAC-SHA256 dari isi mentah request dibandingkan header `X-MiomiPay-Signature`.
7. Kedua jalur memakai satu fungsi yang sama, `terapkanStatusPembayaran` di `server/utils/pembayaran.ts`, sehingga tidak mungkin berperilaku berbeda.
8. Proses dibuat idempoten: pemanggilan berulang tidak memperpanjang boost dan tidak mengaktifkannya dua kali.

**Kenapa polling yang jadi jalur utama, bukan webhook.** Webhook adalah permintaan masuk ke aplikasi kita. Saat aplikasi berjalan di `localhost`, Midtrans maupun MiomiPay tidak bisa menjangkaunya, jadi aktivasi boost tidak akan pernah terjadi walaupun pembeli sudah membayar. Permintaan polling justru keluar dari server kita ke internet, sehingga cara itu bekerja tanpa tunnel, tanpa ngrok, dan tanpa VPS. Webhook baru berguna setelah aplikasi punya alamat publik.

Kunci API hanya dipakai di server dan tidak pernah dikirim ke klien. Tidak ada kunci pembayaran di `runtimeConfig.public` sama sekali. Halaman `/api/payments/config` mengembalikan status kesiapan (kunci terisi, sandbox atau bukan, alamat API terisi, webhook secret terisi) tanpa membocorkan nilainya, dan halaman boost memakainya untuk menampilkan peringatan yang jelas alih-alih gagal senyap.

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
NUXT_APP_SECRET="ganti-dengan-kunci-acak-panjang"
MIOMIPAY_SANDBOX_KEY="MP-SB-xxxxx"
MIOMIPAY_WEBHOOK_SECRET="whsec_xxxxx"
MIOMIPAY_BASE_URL="https://pg.miomidev.com/api/v1"
MIOMIPAY_ENV="sandbox"
UPLOAD_DIR="public/uploads"
```

## 14. Keputusan Arsitektur

| Keputusan                                   | Alasan                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Nuxt 4 satu proyek, bukan dua aplikasi      | Mengurangi kerumitan CORS dan deploy, dan satu bahasa untuk seluruh kode.                                    |
| PostGIS, bukan pencarian jarak di aplikasi  | Query radius dan urutan jarak lebih akurat dan cepat, serta menunjukkan kemampuan basis data.                |
| Prisma dengan SQL mentah untuk geospasial   | Prisma memudahkan CRUD dan migrasi; query PostGIS yang tidak didukung ditulis sebagai SQL mentah.            |
| Gaya marker lewat `divIcon`                 | Membuat marker emas dan denyut boost bisa ditata dengan CSS yang sama seperti komponen lain.                 |
| Pembayaran lewat polling status ke penyedia | Status pembayaran ditentukan server penyedia, bukan dari klien, dan tetap bekerja di localhost tanpa tunnel. |
| Aktivasi boost dipusatkan di satu fungsi    | Jalur polling dan webhook memakai `terapkanStatusPembayaran` yang sama, jadi tidak mungkin berbeda hasil.    |
