-- ====================================================================
-- EcoCraft Marketplace - Skema Database Lengkap & Sinkron (Terbaru)
-- Gabungan init.sql + Semua Dokumen Migrasi + Sinkronisasi Dummy Data
-- ====================================================================

CREATE DATABASE IF NOT EXISTS ecocraft_db;
USE ecocraft_db;

-- ===== 1. WASTE CATEGORIES =====
-- Harus dibuat di awal karena dijadikan Foreign Key oleh tabel lain
CREATE TABLE waste_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    carbon_factor DECIMAL(5,2) NOT NULL COMMENT 'kg CO2 dihemat per kg limbah'
);

-- ===== 2. USERS =====
-- Menyimpan semua akun: admin, pengrajin, pembeli
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'pengrajin', 'pembeli') NOT NULL DEFAULT 'pembeli',
    photo VARCHAR(255) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    eco_points INT NOT NULL DEFAULT 0,
    status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ===== 3. PENGRAJIN PROFILES =====
-- Data tambahan khusus untuk user dengan role = pengrajin (relasi 1-1 ke users)
CREATE TABLE pengrajin_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    workshop_name VARCHAR(150) NOT NULL,
    description TEXT,
    ktp_photo VARCHAR(255) DEFAULT NULL,
    workshop_photo VARCHAR(255) DEFAULT NULL,
    total_waste_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    eco_score DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== 4. PRODUCTS =====
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pengrajin_id INT NOT NULL,
    waste_category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    image VARCHAR(255) DEFAULT NULL,
    waste_weight_kg DECIMAL(10,2) NOT NULL COMMENT 'berat limbah yang dipakai untuk produk ini',
    carbon_saved_kg DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'dihitung otomatis: waste_weight_kg x carbon_factor',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'produk hanya tampil publik setelah diverifikasi admin',
    verified_at TIMESTAMP NULL DEFAULT NULL,
    verified_by INT NULL DEFAULT NULL COMMENT 'id admin (users.id) yang memverifikasi',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pengrajin_id) REFERENCES pengrajin_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (waste_category_id) REFERENCES waste_categories(id),
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ===== 5. CART =====
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_product (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ===== 6. ORDERS =====
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    total_price DECIMAL(14,2) NOT NULL,
    total_carbon_saved DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_address VARCHAR(255) NOT NULL,
    status ENUM('pending', 'dikemas', 'dikirim', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'pending',
    eco_points_awarded BOOLEAN NOT NULL DEFAULT FALSE, -- Ditambahkan agar cocok dengan dummy data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id)
);

-- ===== 7. ORDER ITEMS =====
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    pengrajin_id INT NULL,                      -- Ditambahkan agar cocok dengan dummy data
    product_name VARCHAR(150) NULL,             -- Ditambahkan agar cocok dengan dummy data
    qty INT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    carbon_saved_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ===== 8. WASTE DONATIONS =====
CREATE TABLE waste_donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT NOT NULL,
    pengrajin_id INT NOT NULL,
    waste_category_id INT NOT NULL,
    estimated_weight DECIMAL(10,2) NOT NULL,     -- Menyesuaikan fix_waste_donations_schema.sql
    actual_weight DECIMAL(10,2) DEFAULT NULL,    -- Menyesuaikan fix_waste_donations_schema.sql
    status ENUM('menunggu', 'dikonfirmasi', 'diterima', 'ditolak', 'dibatalkan', 'diterima_pengrajin', 'pending') NOT NULL DEFAULT 'menunggu', -- Diperluas sementara agar bisa menampung status bahasa inggris/lama dari dummy-data
    pickup_method VARCHAR(50) NULL,              -- Ditambahkan agar cocok dengan dummy data
    eco_points_awarded BOOLEAN DEFAULT FALSE,    -- Ditambahkan agar cocok dengan dummy data
    confirmed_at TIMESTAMP NULL DEFAULT NULL,    -- Ditambahkan agar cocok dengan dummy data
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES users(id),
    FOREIGN KEY (pengrajin_id) REFERENCES pengrajin_profiles(id),
    FOREIGN KEY (waste_category_id) REFERENCES waste_categories(id)
);

-- ===== 9. CHALLENGES =====
CREATE TABLE challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    waste_category_id INT DEFAULT NULL,
    target_kg DECIMAL(10,2) NOT NULL,
    current_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    bonus_eco_points INT DEFAULT 0,             -- Ditambahkan agar cocok dengan dummy data
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('aktif', 'selesai', 'active') NOT NULL DEFAULT 'aktif', -- Diperluas 'active' karena dummy data memakai bahasa inggris
    winner_user_id INT NULL DEFAULT NULL,       -- Ditambahkan agar cocok dengan dummy data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id),
    FOREIGN KEY (waste_category_id) REFERENCES waste_categories(id),
    FOREIGN KEY (winner_user_id) REFERENCES users(id)
);

-- ===== 10. CHALLENGE PARTICIPANTS =====
CREATE TABLE challenge_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_id INT NOT NULL,
    user_id INT NOT NULL,
    proof_image VARCHAR(255) DEFAULT NULL,
    contributed_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_challenge_user (challenge_id, user_id),
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===== 11. REVIEWS =====
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    order_id INT NOT NULL,
    rating TINYINT NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_order_product_review (order_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
    -- Perhatian: Klausa CHECK (rating BETWEEN 1 AND 5) dilepas demi mendukung kompatibilitas versi MySQL lama (< 8.0) di phpMyAdmin Anda
);

-- ====================================================================
-- SEED DATA AWAL (WAJIB NYALA SEBELUM DUMMY DATA MASUK)
-- ====================================================================

-- Kategori limbah dasar beserta faktor konversinya
INSERT INTO waste_categories (name, carbon_factor) VALUES
('plastik', 6.0),
('kertas', 1.1),
('kain', 5.5),
('logam', 9.0),
('kayu', 1.8);

-- Akun dasar administrator (email: admin@ecocraft.com / password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin EcoCraft', 'admin@ecocraft.com', '$2a$10$2rO6LDlYyXmzJbwYrN4zwuRpBzohokf6Du1zP.L8IEA45X19hNPU6', 'admin');