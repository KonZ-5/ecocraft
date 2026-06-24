-- ============================================
-- EcoCraft Marketplace - DUMMY DATA untuk testing
-- Jalankan SETELAH init_complete.sql:
--   mysql -u root -p ecocraft_db < dummy-data.sql
--
-- Semua password dummy = "123456"
-- (hash bcrypt di bawah ini sudah sesuai dengan teks itu)
-- ============================================

-- ===== USERS =====
-- 3 pembeli + 4 pengrajin (1 di antaranya BELUM diverifikasi, untuk uji flow admin)
INSERT INTO users (name, email, password, role, address, eco_points) VALUES
('Andi Saputra', 'andi@test.com', '$2a$10$RI5X41.tNxKDQVgM5hMGreQBqnlAoJMR.To9MfDl1o5ffd1nmY8gm', 'pembeli', 'Jl. Mawar No. 10, Jakarta', 0),
('Rina Wulandari', 'rina@test.com', '$2a$10$RI5X41.tNxKDQVgM5hMGreQBqnlAoJMR.To9MfDl1o5ffd1nmY8gm', 'pembeli', 'Jl. Anggrek No. 5, Bandung', 0),
('Dewi Lestari', 'dewi@test.com', '$2a$10$RI5X41.tNxKDQVgM5hMGreQBqnlAoJMR.To9MfDl1o5ffd1nmY8gm', 'pembeli', 'Jl. Melati No. 7, Surabaya', 0),
('Siti Aminah', 'siti@test.com', '$2a$10$RI5X41.tNxKDQVgM5hMGreQBqnlAoJMR.To9MfDl1o5ffd1nmY8gm', 'pengrajin', 'Jl. Kerajinan No. 1, Bandung', 0),
('Joko Susilo', 'joko@test.com', '$2a$10$RI5X41.tNxKDQVgM5hMGreQBqnlAoJMR.To9MfDl1o5ffd1nmY8gm', 'pengrajin', 'Jl. Kayu Putih No. 3, Yogyakarta', 0),
('Maya Putri', 'maya@test.com', '$2a$10$RI5X41.tNxKDQVgM5hMGreQBqnlAoJMR.To9MfDl1o5ffd1nmY8gm', 'pengrajin', 'Jl. Tekstil No. 9, Jakarta', 0),
('Bambang Setiawan', 'bambang@test.com', '$2a$10$RI5X41.tNxKDQVgM5hMGreQBqnlAoJMR.To9MfDl1o5ffd1nmY8gm', 'pengrajin', 'Jl. Logam No. 2, Surabaya', 0);

-- ===== PENGRAJIN PROFILES =====
INSERT INTO pengrajin_profiles (user_id, workshop_name, description, is_verified) VALUES
((SELECT id FROM users WHERE email = 'siti@test.com'), 'Siti Craft', 'Kerajinan tas & dompet dari plastik dan kain perca.', TRUE),
((SELECT id FROM users WHERE email = 'joko@test.com'), 'EcoWood Jogja', 'Furnitur dan dekorasi dari kayu & kertas bekas.', TRUE),
((SELECT id FROM users WHERE email = 'maya@test.com'), 'Kain Kita', 'Produk fashion dari kain perca dan botol plastik.', TRUE),
((SELECT id FROM users WHERE email = 'bambang@test.com'), 'Logam Baru', 'Kerajinan logam daur ulang. Masih menunggu verifikasi.', FALSE);

-- ===== PRODUCTS =====
INSERT INTO products (pengrajin_id, waste_category_id, name, description, price, stock, waste_weight_kg, carbon_saved_kg) VALUES
((SELECT id FROM pengrajin_profiles WHERE workshop_name = 'Siti Craft'),
 (SELECT id FROM waste_categories WHERE name = 'plastik'),
 'Tas Belanja dari Plastik Daur Ulang', 'Tas belanja kuat dan tahan air, dibuat dari botol plastik bekas.', 45000, 20, 0.80, 4.80),

((SELECT id FROM pengrajin_profiles WHERE workshop_name = 'Siti Craft'),
 (SELECT id FROM waste_categories WHERE name = 'kain'),
 'Dompet Kain Perca', 'Dompet unik bermotif kain perca, setiap unit punya motif berbeda.', 35000, 15, 0.30, 1.65),

((SELECT id FROM pengrajin_profiles WHERE workshop_name = 'EcoWood Jogja'),
 (SELECT id FROM waste_categories WHERE name = 'kayu'),
 'Rak Dinding Kayu Bekas', 'Rak dinding minimalis dari kayu palet bekas.', 120000, 10, 2.50, 4.50),

((SELECT id FROM pengrajin_profiles WHERE workshop_name = 'EcoWood Jogja'),
 (SELECT id FROM waste_categories WHERE name = 'kertas'),
 'Vas Bunga dari Kertas Bekas', 'Vas bunga dekoratif hasil olahan bubur kertas daur ulang.', 40000, 25, 0.60, 0.66),

((SELECT id FROM pengrajin_profiles WHERE workshop_name = 'Kain Kita'),
 (SELECT id FROM waste_categories WHERE name = 'kain'),
 'Tote Bag Kain Perca Motif', 'Tote bag kasual dari kain perca pilihan.', 55000, 30, 0.50, 2.75),

((SELECT id FROM pengrajin_profiles WHERE workshop_name = 'Kain Kita'),
 (SELECT id FROM waste_categories WHERE name = 'plastik'),
 'Sandal dari Botol Plastik', 'Sandal ringan dengan sol dari serpihan botol plastik daur ulang.', 65000, 18, 1.00, 6.00);

-- ===== CART (punya Andi, belum checkout) =====
INSERT INTO cart (user_id, product_id, qty) VALUES
((SELECT id FROM users WHERE email = 'andi@test.com'),
 (SELECT id FROM products WHERE name = 'Rak Dinding Kayu Bekas'), 1),
((SELECT id FROM users WHERE email = 'andi@test.com'),
 (SELECT id FROM products WHERE name = 'Tote Bag Kain Perca Motif'), 2);

-- ===== ORDERS (1 selesai milik Andi, 1 masih diproses milik Rina) =====
INSERT INTO orders (buyer_id, total_price, total_carbon_saved, shipping_address, status, eco_points_awarded) VALUES
((SELECT id FROM users WHERE email = 'andi@test.com'), 125000, 11.25, 'Jl. Mawar No. 10, Jakarta', 'selesai', TRUE);
SET @order1_id = LAST_INSERT_ID();

INSERT INTO orders (buyer_id, total_price, total_carbon_saved, shipping_address, status, eco_points_awarded) VALUES
((SELECT id FROM users WHERE email = 'rina@test.com'), 105000, 6.66, 'Jl. Anggrek No. 5, Bandung', 'dikemas', FALSE);
SET @order2_id = LAST_INSERT_ID();

INSERT INTO order_items (order_id, product_id, pengrajin_id, product_name, qty, price, carbon_saved_kg) VALUES
(@order1_id, (SELECT id FROM products WHERE name = 'Tas Belanja dari Plastik Daur Ulang'),
 (SELECT pengrajin_id FROM products WHERE name = 'Tas Belanja dari Plastik Daur Ulang'),
 'Tas Belanja dari Plastik Daur Ulang', 2, 45000, 9.60),
(@order1_id, (SELECT id FROM products WHERE name = 'Dompet Kain Perca'),
 (SELECT pengrajin_id FROM products WHERE name = 'Dompet Kain Perca'),
 'Dompet Kain Perca', 1, 35000, 1.65),
(@order2_id, (SELECT id FROM products WHERE name = 'Vas Bunga dari Kertas Bekas'),
 (SELECT pengrajin_id FROM products WHERE name = 'Vas Bunga dari Kertas Bekas'),
 'Vas Bunga dari Kertas Bekas', 1, 40000, 0.66),
(@order2_id, (SELECT id FROM products WHERE name = 'Sandal dari Botol Plastik'),
 (SELECT pengrajin_id FROM products WHERE name = 'Sandal dari Botol Plastik'),
 'Sandal dari Botol Plastik', 1, 65000, 6.00);

-- ===== WASTE DONATIONS (Kolom _kg dihilangkan agar sinkron dengan database baru) =====
INSERT INTO waste_donations (donor_id, pengrajin_id, waste_category_id, estimated_weight, actual_weight, pickup_method, status, eco_points_awarded, confirmed_at) VALUES
((SELECT id FROM users WHERE email = 'dewi@test.com'),
 (SELECT id FROM pengrajin_profiles WHERE workshop_name = 'Siti Craft'),
 (SELECT id FROM waste_categories WHERE name = 'plastik'),
 5.00, 4.80, 'antar_sendiri', 'dikonfirmasi', TRUE, NOW());

INSERT INTO waste_donations (donor_id, pengrajin_id, waste_category_id, estimated_weight, pickup_method, status) VALUES
((SELECT id FROM users WHERE email = 'andi@test.com'),
 (SELECT id FROM pengrajin_profiles WHERE workshop_name = 'Kain Kita'),
 (SELECT id FROM waste_categories WHERE name = 'kain'),
 2.00, 'jemput', 'diterima_pengrajin');

INSERT INTO waste_donations (donor_id, pengrajin_id, waste_category_id, estimated_weight, pickup_method, status) VALUES
((SELECT id FROM users WHERE email = 'rina@test.com'),
 (SELECT id FROM pengrajin_profiles WHERE workshop_name = 'EcoWood Jogja'),
 (SELECT id FROM waste_categories WHERE name = 'kayu'),
 3.00, 'antar_sendiri', 'pending');

-- ===== CHALLENGES (1 aktif, 1 sudah selesai dengan pemenang) =====
INSERT INTO challenges (admin_id, title, description, waste_category_id, target_kg, current_kg, bonus_eco_points, start_date, end_date, status) VALUES
((SELECT id FROM users WHERE email = 'admin@ecocraft.com'),
 'Daur Ulang Plastik Juni 2026', 'Ayo kumpulkan donasi & produk dari limbah plastik sebanyak-banyaknya bulan ini!',
 (SELECT id FROM waste_categories WHERE name = 'plastik'), 50.00, 20.50, 100, '2026-06-01', '2026-06-30', 'active');
SET @challenge1_id = LAST_INSERT_ID();

INSERT INTO challenges (admin_id, title, description, waste_category_id, target_kg, current_kg, bonus_eco_points, start_date, end_date, status, winner_user_id) VALUES
((SELECT id FROM users WHERE email = 'admin@ecocraft.com'),
 'Daur Ulang Kain Mei 2026', 'Challenge bulan lalu untuk limbah kain - sudah selesai.',
 (SELECT id FROM waste_categories WHERE name = 'kain'), 30.00, 30.00, 150, '2026-05-01', '2026-05-31', 'selesai',
 (SELECT id FROM users WHERE email = 'maya@test.com'));
SET @challenge2_id = LAST_INSERT_ID();

INSERT INTO challenge_participants (challenge_id, user_id, contributed_kg) VALUES
(@challenge1_id, (SELECT id FROM users WHERE email = 'andi@test.com'), 8.50),
(@challenge1_id, (SELECT id FROM users WHERE email = 'maya@test.com'), 12.00),
(@challenge2_id, (SELECT id FROM users WHERE email = 'maya@test.com'), 18.00),
(@challenge2_id, (SELECT id FROM users WHERE email = 'siti@test.com'), 12.00);

-- ===== REVIEWS (untuk order1 milik Andi yang sudah "selesai") =====
INSERT INTO reviews (user_id, product_id, order_id, rating, comment) VALUES
((SELECT id FROM users WHERE email = 'andi@test.com'),
 (SELECT id FROM products WHERE name = 'Tas Belanja dari Plastik Daur Ulang'),
 @order1_id, 5, 'Tasnya kuat dan modelnya bagus, recommended banget!'),
((SELECT id FROM users WHERE email = 'andi@test.com'),
 (SELECT id FROM products WHERE name = 'Dompet Kain Perca'),
 @order1_id, 4, 'Dompetnya unik, motif kain percanya lucu.');

-- ============================================
-- SINKRONISASI ANGKA HASIL (eco_score, eco_points, total_waste_kg)
-- ============================================
UPDATE pengrajin_profiles SET
    total_waste_kg = (
        COALESCE((SELECT SUM(waste_weight_kg) FROM products WHERE products.pengrajin_id = pengrajin_profiles.id), 0) +
        COALESCE((SELECT SUM(actual_weight) FROM waste_donations WHERE waste_donations.pengrajin_id = pengrajin_profiles.id AND status = 'dikonfirmasi'), 0)
    ),
    eco_score = (
        COALESCE((SELECT SUM(waste_weight_kg) FROM products WHERE products.pengrajin_id = pengrajin_profiles.id), 0) +
        COALESCE((SELECT SUM(actual_weight) FROM waste_donations WHERE waste_donations.pengrajin_id = pengrajin_profiles.id AND status = 'dikonfirmasi'), 0)
    );

UPDATE users SET eco_points = 11 WHERE email = 'andi@test.com';
UPDATE users SET eco_points = 48 WHERE email = 'dewi@test.com';
UPDATE users SET eco_points = 150 WHERE email = 'maya@test.com';