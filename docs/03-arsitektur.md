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

| Lapis | Pilihan | Alasan |
|---|---|---|
| Framework | Nuxt 4 | Satu proyek untuk UI dan server API, SSR untuk SEO halaman detail lapak, TypeScript menyeluruh. |
| Bahasa | TypeScript | Tipe kuat dari basis data sampai UI, cocok untuk portofolio yang rapi. |
| UI | Vue 3 + Tailwind CSS | Komponen reaktif untuk peta dan filter, Tailwind mempercepat konsistensi desain. |
| Peta | Leaflet + OpenStreetMap | Gratis, tanpa kunci API, banyak referensi. |
| Basis data | PostgreSQL + PostGIS | PostGIS menangani pencarian radius dan pengurutan jarak dengan benar. |
| ORM | Prisma | Umum dipakai, migrasi jelas; query geospasial dilakukan lewat SQL mentah. Alternatif: Drizzle (dukungan PostGIS lebih langsung). |
| Autentikasi | nuxt-auth-utils (cookie sesi) atau sidebase/nuxt-auth | nuxt-auth-utils ringan dan cukup untuk kredensial dan peran. Alternatif: Auth.js bila butuh penyedia login sosial. |
| Pembayaran | Midtrans Snap | Sesuai kebutuhan pembayaran lokal, sudah dipakai di proyek pelatihan. |
| Validasi | Zod | Validasi skema di server dan di klien dari satu sumber. |
| Unggah foto | Lokal saat pengembangan, S3 atau Cloudinary saat produksi | Sederhana saat mulai, bisa naik ke penyimpanan objek. |

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

| Tabel | Kolom kunci | Catatan |
|---|---|---|
| `users` | id, name, email (unik), password_hash, role (`owner` atau `admin`), created_at | Kata sandi di-hash. |
| `businesses` | id, owner_id, name, slug, category_id, description, address, location `geography(Point,4326)`, status (`pending`, `live`, `rejected`, `inactive`), created_at, updated_at, deleted_at | `location` memakai PostGIS. `deleted_at` untuk hapus lunak. |
| `photos` | id, business_id, url, sort_order | |
| `items` | id, business_id, name, price, sort_order | Menu atau layanan. |
| `opening_hours` | id, business_id, day (0 sampai 6), open_time, close_time, is_closed | |
| `categories` | id, name, slug, color, icon | Warna mengikuti palet kategori di dokumen desain. |
| `boost_packages` | id, name, duration_days, price | Data, bukan kode. |
| `boosts` | id, business_id, package_id, user_id, starts_at, ends_at, status (`pending`, `active`, `expired`, `failed`) | Satu boost aktif per lapak. |
| `payments` | id, boost_id, order_id (unik), gross_amount, status (`pending`, `settlement`, `expire`, `deny`, `cancel`), payment_type, raw_response (JSONB), created_at | `order_id` untuk Midtrans. |

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

| Metode | Endpoint | Akses | Keterangan |
|---|---|---|---|
| POST | `/api/auth/register` | publik | Daftar akun pemilik. |
| POST | `/api/auth/login` | publik | Masuk, membuat sesi. |
| POST | `/api/auth/logout` | masuk | Keluar. |
| GET | `/api/businesses` | publik | Daftar lapak. Query: `q`, `category`, `lat`, `lng`, `radius`, `page`. |
| GET | `/api/businesses/:id` | publik | Detail lapak. |
| POST | `/api/businesses` | pemilik | Tambah lapak. |
| PATCH | `/api/businesses/:id` | pemilik pemiliknya atau admin | Ubah lapak. |
| DELETE | `/api/businesses/:id` | pemilik pemiliknya atau admin | Hapus lunak. |
| POST | `/api/businesses/:id/photos` | pemilik | Unggah foto. |
| GET | `/api/categories` | publik | Daftar kategori. |
| GET | `/api/boost-packages` | publik | Daftar paket boost. |
| POST | `/api/boosts` | pemilik | Buat transaksi boost dan Snap token. |
| POST | `/api/payments/notification` | Midtrans | Webhook pembayaran. Verifikasi tanda tangan. |
| GET | `/api/boosts/mine` | pemilik | Riwayat boost saya. |
| GET | `/api/admin/businesses` | admin | Daftar lapak untuk moderasi. |
| PATCH | `/api/admin/businesses/:id/status` | admin | Setujui, tolak, atau nonaktifkan. |
| GET | `/api/admin/payments` | admin | Daftar transaksi. |

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
2. Server memanggil Snap untuk membuat token, lalu mengirim token ke klien.
3. Klien memanggil `snap.pay(token)`.
4. Midtrans mengirim webhook ke `/api/payments/notification`.
5. Server memverifikasi tanda tangan: SHA-512 dari `order_id + status_code + gross_amount + server_key`.
6. Bila status `settlement` atau `capture`, server mengaktifkan boost: `status = 'active'`, `starts_at = now`, `ends_at = now + duration_days`.
7. Proses dibuat idempoten: `order_id` yang sama tidak mengaktifkan boost dua kali.
8. Pengecekan status transaksi ke Midtrans disediakan sebagai cadangan bila webhook tidak sampai.

Kunci server hanya dipakai di server, tidak pernah dikirim ke klien. Kunci klien boleh dipakai di peramban untuk Snap.

## 10. Unggah Foto

- Terima `multipart/form-data` di server, validasi tipe dan ukuran.
- Kecilkan dan ubah ke format efisien dengan Sharp sebelum disimpan.
- Pengembangan: simpan di `public/uploads`. Produksi: unggah ke penyimpanan objek (S3 atau Cloudinary) dan simpan URL-nya di basis data.
- Nama berkas diberi acak untuk mencegah tabrakan dan tebak-tebakan.

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

| Keputusan | Alasan |
|---|---|
| Nuxt 4 satu proyek, bukan dua aplikasi | Mengurangi kerumitan CORS dan deploy, dan satu bahasa untuk seluruh kode. |
| PostGIS, bukan pencarian jarak di aplikasi | Query radius dan urutan jarak lebih akurat dan cepat, serta menunjukkan kemampuan basis data. |
| Prisma dengan SQL mentah untuk geospasial | Prisma memudahkan CRUD dan migrasi; query PostGIS yang tidak didukung ditulis sebagai SQL mentah. |
| Gaya marker lewat `divIcon` | Membuat marker emas dan denyut boost bisa ditata dengan CSS yang sama seperti komponen lain. |
| Pembayaran lewat webhook sebagai sumber kebenaran | Status pembayaran tidak boleh ditentukan dari sisi klien saja. |
