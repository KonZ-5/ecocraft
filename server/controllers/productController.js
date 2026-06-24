import db from "../config/database.js";
import { calculateCarbonSaved, recalculatePengrajinEcoScore } from "../utils/ecoScore.js";
import { addEcoPoints } from "../utils/ecoPoints.js";

// GET Produk Milik Pengrajin yang Login
const getMyProducts = (req, res) => {
  const query = `
    SELECT
      products.*,
      waste_categories.name AS waste_category_name
    FROM products
    JOIN pengrajin_profiles
      ON products.pengrajin_id = pengrajin_profiles.id
    LEFT JOIN waste_categories
      ON products.waste_category_id = waste_categories.id
    WHERE pengrajin_profiles.user_id = ?
    ORDER BY products.created_at DESC
  `;

  db.query(query, [req.user.id], (err, results) => {

        if (err) {
            return res.status(500).json({
                status: "error",
                message: err.message,
            });
        }

        return res.status(200).json({
            status: "success",
            data: results,
        });
    });
};

const getAllProduk = (req, res) => {
    const name = req.query.name || "";
    const waste_category = req.query.waste_category || "";
    const pengrajin_id = req.query.pengrajin_id || "";

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Perubahan ada di klausa WHERE di bawah ini
    // products.is_verified = TRUE  -> hanya produk yang sudah disetujui admin yang muncul di marketplace publik
    let query = `
        SELECT
            products.*,
            pengrajin_profiles.workshop_name,
            pengrajin_profiles.eco_score AS pengrajin_eco_score,
            waste_categories.name AS waste_category_name
        FROM products
        JOIN pengrajin_profiles ON products.pengrajin_id = pengrajin_profiles.id
        JOIN waste_categories ON products.waste_category_id = waste_categories.id
        WHERE products.is_active = TRUE
        AND products.is_verified = TRUE
        AND pengrajin_profiles.is_verified = TRUE
        AND products.name LIKE ?
    `;

    let queryParams = [`%${name}%`];

    if (waste_category) {
        query += " AND waste_categories.name = ?";
        queryParams.push(waste_category);
    }

    if (pengrajin_id) {
        query += " AND products.pengrajin_id = ?";
        queryParams.push(pengrajin_id);
    }

    query += " ORDER BY products.created_at DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    db.query(query, queryParams, (err, results) => {
        if (err) {
            return res.status(500).json({
                status: "error",
                message: err.message,
            });
        }

        return res.status(200).json({
            status: "success",
            page,
            limit,
            data: results,
        });
    });
};

// GET Produk Berdasarkan ID (publik) - termasuk kalkulasi dampak lingkungan
const getProdukById = (req, res) => {
    const query = `
        SELECT
            products.*,
            pengrajin_profiles.workshop_name,
            pengrajin_profiles.description AS workshop_description,
            pengrajin_profiles.eco_score AS pengrajin_eco_score,
            pengrajin_profiles.is_verified AS pengrajin_verified,
            waste_categories.name AS waste_category_name,
            waste_categories.carbon_factor
        FROM products
        JOIN pengrajin_profiles ON products.pengrajin_id = pengrajin_profiles.id
        JOIN waste_categories ON products.waste_category_id = waste_categories.id
        WHERE products.id = ?
    `;

    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Produk tidak ditemukan" });
        }
        res.status(200).json({ status: "success", data: results[0] });
    });
};

// POST Tambah Produk Baru (khusus pengrajin yang sudah terverifikasi admin)
const createProduk = (req, res) => {
    const { waste_category_id, name, description, price, stock, waste_weight_kg, image } = req.body;

    if (!waste_category_id || !name || !price || !waste_weight_kg) {
        return res.status(400).json({
            status: "fail",
            message: "waste_category_id, name, price, dan waste_weight_kg wajib diisi.",
        });
    }
    if (Number(price) <= 0) {
        return res.status(400).json({ status: "fail", message: "Harga harus lebih dari 0." });
    }
    if (Number(waste_weight_kg) <= 0) {
        return res.status(400).json({ status: "fail", message: "Berat limbah harus lebih dari 0." });
    }

    db.query("SELECT * FROM pengrajin_profiles WHERE user_id = ?", [req.user.id], (err, profileResults) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (profileResults.length === 0) {
            return res.status(404).json({ status: "fail", message: "Profil pengrajin tidak ditemukan." });
        }

        const pengrajinProfile = profileResults[0];
        if (!pengrajinProfile.is_verified) {
            return res.status(403).json({
                status: "fail",
                message: "Akun Anda belum diverifikasi admin. Belum bisa menambahkan produk.",
            });
        }

        db.query("SELECT carbon_factor FROM waste_categories WHERE id = ?", [waste_category_id], (err, catResults) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            if (catResults.length === 0) {
                return res.status(400).json({ status: "fail", message: "Kategori limbah tidak ditemukan." });
            }

            const carbonSaved = calculateCarbonSaved(waste_weight_kg, catResults[0].carbon_factor);

            const insertQuery = `
                INSERT INTO products
                    (pengrajin_id, waste_category_id, name, description, price, stock, image, waste_weight_kg, carbon_saved_kg, is_verified)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)
            `;
            const values = [
                pengrajinProfile.id,
                waste_category_id,
                name,
                description || null,
                price,
                stock || 0,
                image || null,
                waste_weight_kg,
                carbonSaved
            ];

            db.query(insertQuery, values, (err, result) => {
                if (err) {
                    return res.status(500).json({ status: "error", message: err.message });
                }

                recalculatePengrajinEcoScore(pengrajinProfile.id, () => {
                    addEcoPoints(req.user.id, 5);
                    
                    res.status(201).json({
                        status: "success",
                        message: "Produk berhasil ditambahkan. Menunggu verifikasi admin sebelum tampil di marketplace.",
                        id: result.insertId,
                        carbon_saved_kg: carbonSaved,
                        is_verified: false,
                    });
                });
            });
        });
    });
};

// PUT Update Produk (ownership sudah divalidasi middleware verifyProductOwnership)
const updateProduk = (req, res) => {
    const { name, description, price, stock, waste_weight_kg, waste_category_id, image, is_active } = req.body;
    const productId = req.params.id;

    db.query("SELECT * FROM products WHERE id = ?", [productId], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Produk tidak ditemukan" });
        }

        const existing = results[0];
        const newWasteCategoryId = waste_category_id || existing.waste_category_id;
        const newWasteWeight = waste_weight_kg !== undefined ? waste_weight_kg : existing.waste_weight_kg;

        // Kalau pengrajin (bukan admin) mengedit produk yang sudah terverifikasi,
        // status verifikasi di-reset supaya admin sempat review ulang perubahan
        // sebelum produk tampil lagi di marketplace publik.
        const shouldResetVerification = req.user.role !== "admin" && existing.is_verified;

        const applyUpdate = (carbonSaved) => {
            const query = `
                UPDATE products SET
                    name = ?, description = ?, price = ?, stock = ?,
                    waste_weight_kg = ?, waste_category_id = ?, image = ?,
                    carbon_saved_kg = ?, is_active = ?
                    ${shouldResetVerification ? ", is_verified = FALSE, verified_at = NULL, verified_by = NULL" : ""}
                WHERE id = ?
            `;
            const values = [
                name ?? existing.name,
                description ?? existing.description,
                price ?? existing.price,
                stock ?? existing.stock,
                newWasteWeight,
                newWasteCategoryId,
                image ?? existing.image,
                carbonSaved,
                is_active !== undefined ? is_active : existing.is_active,
                productId,
            ];

            db.query(query, values, (err) => {
                if (err) {
                    return res.status(500).json({ status: "error", message: err.message });
                }
                recalculatePengrajinEcoScore(existing.pengrajin_id, () => {
                    res.status(200).json({
                        status: "success",
                        message: shouldResetVerification
                            ? "Produk berhasil diperbarui. Karena ada perubahan, produk perlu diverifikasi ulang oleh admin sebelum tampil di marketplace."
                            : "Produk berhasil diperbarui",
                    });
                });
            });
        };

        if (waste_weight_kg !== undefined || waste_category_id !== undefined) {
            db.query("SELECT carbon_factor FROM waste_categories WHERE id = ?", [newWasteCategoryId], (err, catResults) => {
                if (err) {
                    return res.status(500).json({ status: "error", message: err.message });
                }
                if (catResults.length === 0) {
                    return res.status(400).json({ status: "fail", message: "Kategori limbah tidak ditemukan." });
                }
                applyUpdate(calculateCarbonSaved(newWasteWeight, catResults[0].carbon_factor));
            });
        } else {
            applyUpdate(existing.carbon_saved_kg);
        }
    });
};

// DELETE Hapus Produk (ownership sudah divalidasi middleware verifyProductOwnership)
const deleteProduk = (req, res) => {
    db.query("SELECT pengrajin_id FROM products WHERE id = ?", [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Produk tidak ditemukan" });
        }
        const pengrajinId = results[0].pengrajin_id;

        db.query("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
            if (err) {
                // Produk sudah pernah dibeli (tercatat di order_items) -> tidak bisa dihapus permanen
                // demi menjaga integritas riwayat transaksi. Nonaktifkan saja (soft delete) sebagai gantinya.
                if (err.errno === 1451) {
                    return db.query("UPDATE products SET is_active = FALSE WHERE id = ?", [req.params.id], (softErr) => {
                        if (softErr) {
                            return res.status(500).json({ status: "error", message: softErr.message });
                        }
                        res.status(200).json({
                            status: "success",
                            message:
                                "Produk ini sudah memiliki riwayat transaksi sehingga tidak bisa dihapus permanen. Produk telah dinonaktifkan (tidak tampil di marketplace) sebagai gantinya.",
                        });
                    });
                }
                return res.status(500).json({ status: "error", message: err.message });
            }
            recalculatePengrajinEcoScore(pengrajinId, () => {
                res.status(200).json({ status: "success", message: "Produk berhasil dihapus" });
            });
        });
    });
};

export {
  getAllProduk,
  getMyProducts,
  getProdukById,
  createProduk,
  updateProduk,
  deleteProduk,
};