import db from "../config/database.js";
import { recalculatePengrajinEcoScore } from "../utils/ecoScore.js";
import { addEcoPoints } from "../utils/ecoPoints.js";

// Poin yang didapat donatur per kg limbah aktual yang diterima
const ECO_POINTS_PER_KG_DONATION = 10;

// GET Semua Donasi
// - admin: lihat semua
// - pengrajin: hanya donasi yang ditujukan ke dia
// - pembeli/donor: hanya donasi yang dia buat
const getAllDonasi = (req, res) => {
    const status = req.query.status || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = `
        SELECT
            waste_donations.*,
            users.name AS donor_name,
            pengrajin_profiles.workshop_name,
            waste_categories.name AS waste_category_name
        FROM waste_donations
        JOIN users ON waste_donations.donor_id = users.id
        JOIN pengrajin_profiles ON waste_donations.pengrajin_id = pengrajin_profiles.id
        JOIN waste_categories ON waste_donations.waste_category_id = waste_categories.id
        WHERE 1=1
    `;
    const queryParams = [];

    if (req.user.role === "pembeli") {
        query += " AND waste_donations.donor_id = ?";
        queryParams.push(req.user.id);
    } else if (req.user.role === "pengrajin") {
        query += " AND pengrajin_profiles.user_id = ?";
        queryParams.push(req.user.id);
    }
    // admin tidak difilter - lihat semua

    if (status) {
        query += " AND waste_donations.status = ?";
        queryParams.push(status);
    }

    query += " ORDER BY waste_donations.created_at DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    db.query(query, queryParams, (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        res.status(200).json({ status: "success", page, limit, data: results });
    });
};

// GET Donasi Berdasarkan ID
const getDonasiById = (req, res) => {
    const query = `
        SELECT
            waste_donations.*,
            users.name AS donor_name,
            pengrajin_profiles.workshop_name, pengrajin_profiles.user_id AS pengrajin_user_id,
            waste_categories.name AS waste_category_name
        FROM waste_donations
        JOIN users ON waste_donations.donor_id = users.id
        JOIN pengrajin_profiles ON waste_donations.pengrajin_id = pengrajin_profiles.id
        JOIN waste_categories ON waste_donations.waste_category_id = waste_categories.id
        WHERE waste_donations.id = ?
    `;

    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Donasi tidak ditemukan" });
        }

        const donation = results[0];
        const isOwnerDonor = donation.donor_id === req.user.id;
        const isOwnerPengrajin = donation.pengrajin_user_id === req.user.id;

        if (req.user.role !== "admin" && !isOwnerDonor && !isOwnerPengrajin) {
            return res.status(403).json({ status: "fail", message: "Anda tidak punya akses ke donasi ini." });
        }

        res.status(200).json({ status: "success", data: donation });
    });
};

// POST Buat Request Donasi Baru (siapa saja yang login: pembeli/pengrajin bisa jadi donor)
const createDonasi = (req, res) => {
    const { pengrajin_id, waste_category_id, estimated_weight, notes } = req.body;

    if (!pengrajin_id || !waste_category_id || !estimated_weight) {
        return res.status(400).json({
            status: "fail",
            message: "pengrajin_id, waste_category_id, dan estimated_weight wajib diisi.",
        });
    }
    if (Number(estimated_weight) <= 0) {
        return res.status(400).json({ status: "fail", message: "Estimasi berat harus lebih dari 0." });
    }

    db.query("SELECT id FROM pengrajin_profiles WHERE id = ? AND is_verified = TRUE", [pengrajin_id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Pengrajin tidak ditemukan atau belum terverifikasi.",
            });
        }

        const insertQuery = `
            INSERT INTO waste_donations
                (
                    donor_id,
                    pengrajin_id,
                    waste_category_id,
                    estimated_weight,
                    notes
                )
            VALUES (?, ?, ?, ?, ?)
        `;
        db.query(
            insertQuery,
            [req.user.id, pengrajin_id, waste_category_id, estimated_weight, notes || null],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ status: "error", message: err.message });
                }

                // Kalkulasi eco points saat pengajuan donasi dibuat
                const ecoPoints = Math.floor(Number(estimated_weight) * 10);

                db.query(
                    `
                    UPDATE users
                    SET eco_points = eco_points + ?
                    WHERE id = ?
                    `,
                    [ecoPoints, req.user.id],
                    (err2) => {
                        if (err2) {
                            return res.status(500).json({
                                status: "error",
                                message: err2.message
                            });
                        }

                        return res.status(201).json({
                            status: "success",
                            message: "Request donasi berhasil dibuat. Menunggu konfirmasi pengrajin.",
                            id: result.insertId,
                            eco_points_earned: ecoPoints
                        });
                    }
                );
            }
        );
    });
};

// PUT Konfirmasi Donasi (khusus pengrajin tujuan donasi)
const confirmDonasi = (req, res) => {
    const { status, actual_weight } = req.body;
    const allowedStatus = ["dikonfirmasi", "diterima", "ditolak"];

    if (!status || !allowedStatus.includes(status)) {
        return res.status(400).json({
            status: "fail",
            message: `Status wajib salah satu dari: ${allowedStatus.join(", ")}`,
        });
    }
    if (status === "diterima" && (!actual_weight || Number(actual_weight) <= 0)) {
        return res.status(400).json({
            status: "fail",
            message: "actual_weight wajib diisi (lebih dari 0) saat status diterima.",
        });
    }

    const query = `
        SELECT waste_donations.*, pengrajin_profiles.user_id AS pengrajin_user_id
        FROM waste_donations
        JOIN pengrajin_profiles ON waste_donations.pengrajin_id = pengrajin_profiles.id
        WHERE waste_donations.id = ?
    `;
    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Donasi tidak ditemukan" });
        }

        const donation = results[0];

        if (req.user.role !== "admin" && donation.pengrajin_user_id !== req.user.id) {
            return res.status(403).json({
                status: "fail",
                message: "Hanya pengrajin tujuan donasi ini yang bisa mengonfirmasi.",
            });
        }
        if (donation.status === "diterima" || donation.status === "ditolak" || donation.status === "dibatalkan") {
            return res.status(409).json({
                status: "fail",
                message: `Donasi sudah berstatus '${donation.status}' and tidak bisa diubah lagi.`,
            });
        }

        const updateQuery =
            status === "diterima"
                ? "UPDATE waste_donations SET status = ?, actual_weight = ? WHERE id = ?"
                : "UPDATE waste_donations SET status = ? WHERE id = ?";
        const updateValues = status === "diterima" ? [status, actual_weight, req.params.id] : [status, req.params.id];

        db.query(updateQuery, updateValues, (err) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }

            if (status !== "diterima") {
                return res.status(200).json({ status: "success", message: `Donasi berhasil diperbarui menjadi '${status}'` });
            }

            // Status 'diterima' -> beri eco points ke donor & update eco score pengrajin
            const ecoPoints = Math.round(actual_weight * ECO_POINTS_PER_KG_DONATION);

            db.query(
                "UPDATE users SET eco_points = eco_points + ? WHERE id = ?",
                [ecoPoints, donation.donor_id],
                (err) => {
                    if (err) {
                        return res.status(500).json({ status: "error", message: err.message });
                    }
                    recalculatePengrajinEcoScore(donation.pengrajin_id, () => {
                        // Tambah bonus Poin Tambahan Saat Donasi Sukses Diterima
                        addEcoPoints(donation.donor_id, 20); // Donatur mendapat +20 poin
                        addEcoPoints(donation.pengrajin_user_id, 15); // Pengrajin mendapat +15 poin

                        res.status(200).json({
                            status: "success",
                            message: "Donasi diterima. Eco Points donor & Eco Score pengrajin telah diperbarui.",
                            eco_points_diberikan: ecoPoints,
                        });
                    });
                }
            );
        });
    });
};

// DELETE Batalkan Donasi (khusus donor pemilik, hanya boleh selama masih 'menunggu')
const cancelDonasi = (req, res) => {
    db.query("SELECT * FROM waste_donations WHERE id = ?", [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Donasi tidak ditemukan" });
        }

        const donation = results[0];

        if (req.user.role !== "admin" && donation.donor_id !== req.user.id) {
            return res.status(403).json({ status: "fail", message: "Anda hanya bisa membatalkan donasi milik Anda sendiri." });
        }
        if (donation.status !== "menunggu") {
            return res.status(409).json({
                status: "fail",
                message: "Donasi yang sudah dikonfirmasi/diterima tidak bisa dibatalkan.",
            });
        }

        db.query("UPDATE waste_donations SET status = 'dibatalkan' WHERE id = ?", [req.params.id], (err) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.status(200).json({ status: "success", message: "Donasi berhasil dibatalkan" });
        });
    });
};

export { getAllDonasi, getDonasiById, createDonasi, confirmDonasi, cancelDonasi };