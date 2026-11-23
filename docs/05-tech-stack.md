# 05 - Saran Bahasa dan Stack

Dokumen ini menjawab pertanyaan: bahasa dan alat apa yang paling cocok untuk proyek ini, dan mengapa.

## Ringkasan Saran

Satu bahasa untuk frontend dan backend: **TypeScript di atas Nuxt 3**. Bahasa kueri: **SQL (PostgreSQL + PostGIS)**.

Alasannya: hampir seluruh pekerjaan proyek ini adalah UI dan data, bukan beban komputasi berat. Memakai TypeScript dari basis data sampai tampilan memberi tipe yang konsisten, satu alat build, satu proses deploy, dan lebih sedikit hal yang bisa salah. Nilai jual portofolionya justru pada alur penuh yang rapi (autentikasi, CRUD, geospasial, pembayaran, admin), dan itu paling cepat terlihat dengan satu tumpukan yang koheren.

## Tabel Keputusan

| Kebutuhan | Pilihan | Alternatif | Alasan pilihan |
|---|---|---|---|
| Bahasa utama | TypeScript | JavaScript | Tipe mencegah bug di batas server dan klien, dan jadi nilai tambah di portofolio. |
| Framework | Nuxt 3 | Next.js (React) | Vue dipilih pemilik; Nuxt memberi UI dan server API dalam satu proyek dan SSR untuk SEO. |
| Gaya | Tailwind CSS | CSS Modules, UnoCSS | Cepat dan konsisten, cocok dengan token desain yang sudah ditetapkan. |
| Basis data | PostgreSQL + PostGIS | MySQL, MongoDB | PostGIS memberi pencarian radius dan jarak yang benar. |
| ORM | Prisma | Drizzle, SQL mentah | Mudah dibaca dan migrasi jelas; query geospasial tetap SQL mentah. |
| Auth | nuxt-auth-utils atau sidebase/nuxt-auth | Lucia (kurang aktif) | Ringan, cocok untuk kredensial dan peran. |
| Peta | Leaflet | Mapbox, Google Maps | Gratis, tanpa kunci API, mudah disesuaikan. |
| Pembayaran | Midtrans Snap | Xendit | Familiar, sandbox mudah, sesuai konteks lokal. |
| Validasi | Zod | Yup, Valibot | Skema tunggal untuk server dan klien. |
| Uji | Vitest (unit), Playwright (end-to-end) | Jest | Cepat dan cocok dengan ekosistem Vite/Nuxt. |

## Kenapa Bukan Go untuk Proyek Ini

Go adalah bahasa backend yang kuat dan banyak dicari di perusahaan Indonesia. Tetapi untuk aplikasi ini, Go kurang tepat sebagai **satu-satunya** tumpukan:

- Bagian tersulit produk ini ada di antarmuka: peta, marker, filter, dan alur checkout. Itu pekerjaan JavaScript/TypeScript, bukan Go.
- Memakai Go berarti dua aplikasi: satu API Go dan satu frontend JS, ditambah pengaturan CORS dan dua proses deploy. Kerumitannya naik, sedangkan hasilnya untuk pengguna sama.
- Keunggulan Go (konkurensi tinggi, beban CPU besar) tidak benar-benar muncul di aplikasi yang trafiknya dibaca dari basis data dan peta.

Go tetap masuk akal kalau tujuannya menunjukkan kemampuan backend. Kalau begitu, bentuk yang lebih jujur adalah **Go sebagai API dan Nuxt sebagai frontend**, bukan Go saja. Ini dicatat sebagai opsi, bukan pilihan utama sekarang.

## Kalau Nanti Ingin Mengganti

- Ganti Nuxt ke Next.js: struktur API dan model data tidak banyak berubah, hanya lapis UI dan konvensi folder.
- Tambah API Go: Nuxt tetap melayani UI, tapi memanggil API Go untuk data lapak. Ini bisa jadi catatan pengembangan lanjutan di README.
- Ganti Prisma ke Drizzle: skema mirip, dan justru menyederhanakan query PostGIS.

## Prinsip Singkat

- Satu bahasa kalau bisa, dua kalau ada alasan kuat.
- Pakai alat yang paling kamu kuasai untuk bagian yang paling sering berubah (UI).
- Simpan keputusan bahasa sebagai catatan, supaya mudah dipertanggungjawabkan saat ditanya.
