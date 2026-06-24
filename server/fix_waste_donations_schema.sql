-- ============================================
-- MIGRASI: Samakan skema waste_donations dengan kode (backend + frontend)
-- Jalankan SEKALI di phpMyAdmin (tab SQL) pada database EcoCraft kamu.
-- ============================================

-- 1. Perluas enum status sementara agar bisa menampung value lama & baru bersamaan
ALTER TABLE waste_donations
    MODIFY status ENUM(
        'pending', 'diterima_pengrajin', 'ditolak', 'dikonfirmasi', 'dibatalkan',
        'menunggu', 'diterima'
    ) NOT NULL DEFAULT 'pending';

-- 2. Migrasikan value status lama ke value baru yang dipakai kode
UPDATE waste_donations SET status = 'menunggu' WHERE status = 'pending';
UPDATE waste_donations SET status = 'diterima' WHERE status = 'diterima_pengrajin';

-- 3. Persempit enum status menjadi hanya value yang dipakai kode
ALTER TABLE waste_donations
    MODIFY status ENUM(
        'menunggu', 'dikonfirmasi', 'diterima', 'ditolak', 'dibatalkan'
    ) NOT NULL DEFAULT 'menunggu';

-- 4. Ganti nama kolom berat agar sesuai nama yang dipakai backend & frontend
ALTER TABLE waste_donations
    CHANGE COLUMN estimated_weight_kg estimated_weight DECIMAL(10,2) NOT NULL,
    CHANGE COLUMN actual_weight_kg actual_weight DECIMAL(10,2) DEFAULT NULL;

-- Catatan:
-- - Kolom pickup_method, eco_points_awarded, confirmed_at TIDAK dihapus
--   (dibiarkan, karena punya default value sendiri & tidak dipakai kode saat ini,
--   jadi tidak akan mengganggu INSERT/UPDATE yang sudah ada).
-- - Setelah migrasi ini, query INSERT di createDonasi (yang sudah diperbaiki
--   sebelumnya menggunakan estimated_weight) akan langsung cocok dengan skema ini.
