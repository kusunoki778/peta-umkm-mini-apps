-- Ganti kolom pembayaran Midtrans dengan kolom MiomiPay.
--
-- Catatan penting: `prisma migrate diff` ikut menyarankan perintah
--   DROP INDEX "businesses_earth_location_idx";
-- Perintah itu TIDAK dijalankan di sini. Indeks tersebut dibuat di migrasi awal
-- untuk mempercepat pencarian radius lewat `earthdistance`. Prisma menyarankannya
-- hanya karena tipe kolom `earth` tidak dikenal Prisma. Kalau dijalankan, fitur
-- "di sekitar saya" kehilangan indeks dan melambat seiring data bertambah.

ALTER TABLE "payments"
  DROP COLUMN "snap_token",
  ADD COLUMN "checkout_url" TEXT,
  ADD COLUMN "provider_ref" TEXT,
  ADD COLUMN "qr_image_url" TEXT;
