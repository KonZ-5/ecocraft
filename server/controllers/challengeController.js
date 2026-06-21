import db from "../config/database.js";

// POST Buat Challenge Baru (admin only)
const createChallenge = (req, res) => {
    const { title, description, waste_category_id, target_kg, start_date, end_date } = req.body;

    if (!title || !target_kg || !start_date || !end_date) {
        return res.status(400).json({
            status: "fail",
            message: "title, target_kg, start_date, dan end_date wajib diisi.",
        });
    }
    if (Number(target_kg) <= 0) {
        return res.status(400).json({ status: "fail", message: "target_kg harus lebih dari 0." });
    }
    if (new Date(end_date) <= new Date(start_date)) {
        return res.status(400).json({ status: "fail", message: "end_date harus setelah start_date." });
    }

    const query = `
        INSERT INTO challenges (admin_id, title, description, waste_category_id, target_kg, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
        query,
        [req.user.id, title, description || null, waste_category_id || null, target_kg, start_date, end_date],
        (err, result) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.status(201).json({ status: "success", message: "Challenge berhasil dibuat", id: result.insertId });
        }
    );
};

// GET Semua Challenge (publik)
const getAllChallenge = (req, res) => {
    const status = req.query.status || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = `
        SELECT challenges.*, waste_categories.name AS waste_category_name
        FROM challenges
        LEFT JOIN waste_categories ON challenges.waste_category_id = waste_categories.id
        WHERE 1=1
    `;
    const queryParams = [];

    if (status) {
        query += " AND challenges.status = ?";
        queryParams.push(status);
    }

    query += " ORDER BY challenges.start_date DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    db.query(query, queryParams, (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Challenge tidak ditemukan" });
        }
        res.status(200).json({ status: "success", page, limit, data: results });
    });
};

// GET Challenge Berdasarkan ID + leaderboard peserta
const getChallengeById = (req, res) => {
    db.query("SELECT * FROM challenges WHERE id = ?", [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Challenge tidak ditemukan" });
        }

        const leaderboardQuery = `
            SELECT challenge_participants.user_id, users.name, challenge_participants.contributed_kg, challenge_participants.proof_image
            FROM challenge_participants
            JOIN users ON challenge_participants.user_id = users.id
            WHERE challenge_id = ?
            ORDER BY challenge_participants.contributed_kg DESC
        `;
        db.query(leaderboardQuery, [req.params.id], (err, leaderboard) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.status(200).json({ status: "success", data: { ...results[0], leaderboard } });
        });
    });
};

// PUT Update Challenge (admin only)
const updateChallenge = (req, res) => {
    const { title, description, target_kg, end_date, status } = req.body;

    db.query("SELECT * FROM challenges WHERE id = ?", [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Challenge tidak ditemukan" });
        }
        const existing = results[0];

        const query = `
            UPDATE challenges SET title = ?, description = ?, target_kg = ?, end_date = ?, status = ? WHERE id = ?
        `;
        const values = [
            title ?? existing.title,
            description ?? existing.description,
            target_kg ?? existing.target_kg,
            end_date ?? existing.end_date,
            status ?? existing.status,
            req.params.id,
        ];

        db.query(query, values, (err) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.status(200).json({ status: "success", message: "Challenge berhasil diperbarui" });
        });
    });
};

// DELETE Hapus Challenge (admin only)
const deleteChallenge = (req, res) => {
    db.query("DELETE FROM challenges WHERE id = ?", [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "fail", message: "Challenge tidak ditemukan" });
        }
        res.status(200).json({ status: "success", message: "Challenge berhasil dihapus" });
    });
};

// POST Ikut Challenge (siapa pun yang login)
const joinChallenge = (req, res) => {
    db.query("SELECT * FROM challenges WHERE id = ? AND status = 'aktif'", [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Challenge tidak ditemukan atau sudah tidak aktif." });
        }

        db.query(
            "INSERT INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)",
            [req.params.id, req.user.id],
            (err) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({ status: "fail", message: "Anda sudah ikut challenge ini." });
                    }
                    return res.status(500).json({ status: "error", message: err.message });
                }
                res.status(201).json({ status: "success", message: "Berhasil ikut challenge!" });
            }
        );
    });
};

// PUT Update Kontribusi/Bukti Partisipasi (hanya milik sendiri)
const updateParticipation = (req, res) => {
    const { contributed_kg, proof_image } = req.body;

    if (contributed_kg === undefined && !proof_image) {
        return res.status(400).json({ status: "fail", message: "Isi minimal contributed_kg atau proof_image." });
    }

    db.query(
        "SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ?",
        [req.params.id, req.user.id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            if (results.length === 0) {
                return res.status(404).json({ status: "fail", message: "Anda belum ikut challenge ini." });
            }

            const existing = results[0];
            const newContributed = contributed_kg !== undefined ? contributed_kg : existing.contributed_kg;

            db.query(
                "UPDATE challenge_participants SET contributed_kg = ?, proof_image = ? WHERE id = ?",
                [newContributed, proof_image ?? existing.proof_image, existing.id],
                (err) => {
                    if (err) {
                        return res.status(500).json({ status: "error", message: err.message });
                    }

                    // update progress total challenge = SUM seluruh kontribusi peserta
                    db.query(
                        `UPDATE challenges SET current_kg = (
                            SELECT COALESCE(SUM(contributed_kg), 0) FROM challenge_participants WHERE challenge_id = ?
                         ) WHERE id = ?`,
                        [req.params.id, req.params.id],
                        (err) => {
                            if (err) {
                                return res.status(500).json({ status: "error", message: err.message });
                            }
                            res.status(200).json({ status: "success", message: "Kontribusi berhasil diperbarui" });
                        }
                    );
                }
            );
        }
    );
};

export {
    createChallenge,
    getAllChallenge,
    getChallengeById,
    updateChallenge,
    deleteChallenge,
    joinChallenge,
    updateParticipation,
};
