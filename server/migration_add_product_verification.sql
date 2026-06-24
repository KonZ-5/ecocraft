-- ============================================
-- MIGRASI: Tambah kolom verifikasi produk
-- Jalankan SEKALI saja, hanya jika database "ecocraft_db" sudah pernah dibuat
-- sebelumnya (jadi tidak mau dihapus ulang dari init.sql).
--
-- Cara pakai:
--   mysql -u root -p ecocraft_db < migration_add_product_verification.sql
-- ============================================

USE ecocraft_db;

ALTER TABLE products
    ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT 'produk hanya tampil publik setelah diverifikasi admin' AFTER is_active,
    ADD COLUMN verified_at TIMESTAMP NULL DEFAULT NULL AFTER is_verified,
    ADD COLUMN verified_by INT NULL DEFAULT NULL
        COMMENT 'id admin (users.id) yang memverifikasi' AFTER verified_at,
    ADD CONSTRAINT fk_products_verified_by
        FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL;

-- Opsional: kalau sudah ada produk lama yang ingin langsung dianggap
-- "terverifikasi" (supaya tidak mendadak hilang semua dari /products),
-- jalankan baris ini sekali setelah ALTER TABLE di atas:
-- UPDATE products SET is_verified = TRUE WHERE is_active = TRUE;
