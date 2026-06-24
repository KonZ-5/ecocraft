import db from "../config/database.js";

// GET Daftar Pengrajin (untuk admin review verifikasi)
// Filter: verified=true/false
const getAllPengrajin = (req, res) => {
    const verified = req.query.verified;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = `
        SELECT
            pengrajin_profiles.*,
            users.name,
            users.email,
            users.status AS account_status
        FROM pengrajin_profiles
        JOIN users
            ON pengrajin_profiles.user_id = users.id
        WHERE 1=1
    `;

    const queryParams = [];

    if (verified === "true" || verified === "false") {
        query += " AND pengrajin_profiles.is_verified = ?";
        queryParams.push(verified === "true" ? 1 : 0);
    }

    query += `
        ORDER BY pengrajin_profiles.created_at DESC
        LIMIT ?
        OFFSET ?
    `;

    queryParams.push(limit, offset);

    db.query(query, queryParams, (err, results) => {
        if (err) {
            return res.status(500).json({
                status: "error",
                message: err.message
            });
        }

        // JANGAN RETURN 404
        return res.status(200).json({
            status: "success",
            page,
            limit,
            data: results || []
        });
    });
};

// PUT Verifikasi Akun Pengrajin
const verifyPengrajin = (req, res) => {
    db.query(
        "UPDATE pengrajin_profiles SET is_verified = TRUE WHERE id = ?",
        [req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ status: "fail", message: "Profil pengrajin tidak ditemukan" });
            }
            res.status(200).json({ status: "success", message: "Pengrajin berhasil diverifikasi" });
        }
    );
};

const getPendingProducts = (req, res) => {
    const query = `
        SELECT
            p.*,
            u.name AS pengrajin_name,
            pp.workshop_name
        FROM products p
        JOIN pengrajin_profiles pp
            ON p.pengrajin_id = pp.id
        JOIN users u
            ON pp.user_id = u.id
        WHERE p.is_verified = FALSE
        ORDER BY p.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                status: "error",
                message: err.message
            });
        }

        res.status(200).json({
            status: "success",
            data: results
        });
    });
};

const verifyProduct = (req, res) => {
    const productId = req.params.id;

    db.query(
        `
        UPDATE products
        SET
            is_verified = TRUE,
            verified_at = NOW(),
            verified_by = ?
        WHERE id = ?
        `,
        [req.user.id, productId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    status: "error",
                    message: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    status: "fail",
                    message: "Produk tidak ditemukan"
                });
            }

            res.status(200).json({
                status: "success",
                message: "Produk berhasil diverifikasi"
            });
        }
    );
};

// PATCH Suspend/Aktifkan Akun User
const updateUserStatus = (req, res) => {
    const { status } = req.body;
    if (!status || !["active", "suspended"].includes(status)) {
        return res.status(400).json({ status: "fail", message: "status wajib 'active' atau 'suspended'." });
    }
    if (Number(req.params.id) === req.user.id) {
        return res.status(400).json({ status: "fail", message: "Anda tidak bisa mengubah status akun Anda sendiri." });
    }

    db.query("UPDATE users SET status = ? WHERE id = ?", [status, req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "fail", message: "User tidak ditemukan" });
        }
        res.status(200).json({ status: "success", message: `Status user berhasil diubah menjadi '${status}'` });
    });
};

// DELETE Hapus Akun (admin only)
const deleteUser = (req, res) => {
    if (Number(req.params.id) === req.user.id) {
        return res.status(400).json({ status: "fail", message: "Anda tidak bisa menghapus akun Anda sendiri." });
    }

    db.query("DELETE FROM users WHERE id = ?", [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "fail", message: "User tidak ditemukan" });
        }
        res.status(200).json({ status: "success", message: "User berhasil dihapus" });
    });
};

// GET Dashboard Statistik
const getDashboardStats = (req, res) => {
    const statsQuery = `
        SELECT
            (SELECT COUNT(*) FROM users WHERE role = 'pembeli') AS total_pembeli,
            (SELECT COUNT(*) FROM users WHERE role = 'pengrajin') AS total_pengrajin,
            (SELECT COUNT(*) FROM pengrajin_profiles WHERE is_verified = TRUE) AS total_pengrajin_terverifikasi,
            (SELECT COUNT(*) FROM products WHERE is_active = TRUE) AS total_produk_aktif,
            (SELECT COUNT(*) FROM orders WHERE status = 'selesai') AS total_transaksi_selesai,
            (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status = 'selesai') AS total_omzet,
            (SELECT COALESCE(SUM(total_carbon_saved), 0) FROM orders WHERE status = 'selesai') AS total_co2_dari_transaksi,
            (SELECT COALESCE(SUM(waste_weight_kg), 0) FROM products) AS total_limbah_dari_produk_kg,
            (SELECT COALESCE(SUM(actual_weight_kg), 0)
            FROM waste_donations
            WHERE status IN ('diterima_pengrajin','diterima'))
            AS total_limbah_dari_donasi_kg,
            (SELECT COUNT(*) FROM waste_donations WHERE status = 'menunggu') AS donasi_menunggu_konfirmasi,
            (SELECT COUNT(*) FROM challenges WHERE status = 'aktif') AS challenge_aktif
    `;

    db.query(statsQuery, (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        res.status(200).json({ status: "success", data: results[0] });
    });
};

export {
    getAllPengrajin,
    verifyPengrajin,

    getPendingProducts,
    verifyProduct,

    updateUserStatus,
    deleteUser,
    getDashboardStats
};
