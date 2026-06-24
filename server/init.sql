-- ============================================
-- EcoCraft Marketplace - Skema Database (Tahap 1)
-- Tabel inti: users, pengrajin_profiles, waste_categories, products
-- Tabel lain (orders, donations, challenges, reviews) menyusul di tahap berikutnya
-- ============================================

CREATE DATABASE IF NOT EXISTS ecocraft_db;
USE ecocraft_db;

-- ===== USERS =====
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

-- ===== PENGRAJIN PROFILES =====
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

-- ===== WASTE CATEGORIES =====
-- Jenis limbah + faktor konversi ke CO2 (kg CO2 dihemat per kg limbah)
CREATE TABLE waste_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    carbon_factor DECIMAL(5,2) NOT NULL COMMENT 'kg CO2 dihemat per kg limbah'
);

-- ===== PRODUCTS =====
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

-- ===== CART =====
-- Satu baris per produk per user di keranjang
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

-- ===== ORDERS =====
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    total_price DECIMAL(14,2) NOT NULL,
    total_carbon_saved DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_address VARCHAR(255) NOT NULL,
    status ENUM('pending', 'dikemas', 'dikirim', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id)
);

-- ===== ORDER ITEMS =====
-- Snapshot harga saat transaksi, supaya histori tidak berubah walau harga produk di-update belakangan
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    qty INT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    carbon_saved_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ===== WASTE DONATIONS =====
CREATE TABLE waste_donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT NOT NULL,
    pengrajin_id INT NOT NULL,
    waste_category_id INT NOT NULL,
    estimated_weight DECIMAL(10,2) NOT NULL,
    actual_weight DECIMAL(10,2) DEFAULT NULL,
    status ENUM('menunggu', 'dikonfirmasi', 'diterima', 'ditolak', 'dibatalkan') NOT NULL DEFAULT 'menunggu',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES users(id),
    FOREIGN KEY (pengrajin_id) REFERENCES pengrajin_profiles(id),
    FOREIGN KEY (waste_category_id) REFERENCES waste_categories(id)
);

-- ===== CHALLENGES =====
CREATE TABLE challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    waste_category_id INT DEFAULT NULL,
    target_kg DECIMAL(10,2) NOT NULL,
    current_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('aktif', 'selesai') NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id),
    FOREIGN KEY (waste_category_id) REFERENCES waste_categories(id)
);

-- ===== CHALLENGE PARTICIPANTS =====
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

-- ===== REVIEWS =====
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
    CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- ============================================
-- SEED DATA
-- ============================================

-- Kategori limbah (faktor CO2 sesuai konsep awal)
INSERT INTO waste_categories (name, carbon_factor) VALUES
('plastik', 6.0),
('kertas', 1.1),
('kain', 5.5),
('logam', 9.0),
('kayu', 1.8);

-- Akun admin awal (email: admin@ecocraft.com / password: admin123)
-- Password sudah di-hash dengan bcrypt, JANGAN simpan plain text di production
INSERT INTO users (name, email, password, role) VALUES
('Admin EcoCraft', 'admin@ecocraft.com', '$2a$10$2rO6LDlYyXmzJbwYrN4zwuRpBzohokf6Du1zP.L8IEA45X19hNPU6', 'admin');
