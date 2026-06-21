import db from "../config/database.js";

// POST Tulis Review (hanya pembeli yang order-nya sudah 'selesai' dan berisi produk tsb)
const createReview = (req, res) => {
    const { product_id, order_id, rating, comment } = req.body;

    if (!product_id || !order_id || !rating) {
        return res.status(400).json({ status: "fail", message: "product_id, order_id, dan rating wajib diisi." });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ status: "fail", message: "rating harus antara 1-5." });
    }

    const verifyQuery = `
        SELECT orders.id
        FROM orders
        JOIN order_items ON orders.id = order_items.order_id
        WHERE orders.id = ? AND orders.buyer_id = ? AND orders.status = 'selesai' AND order_items.product_id = ?
    `;
    db.query(verifyQuery, [order_id, req.user.id, product_id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(403).json({
                status: "fail",
                message: "Anda hanya bisa mengulas produk dari order milik Anda yang sudah selesai.",
            });
        }

        const insertQuery = "INSERT INTO reviews (user_id, product_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)";
        db.query(insertQuery, [req.user.id, product_id, order_id, rating, comment || null], (err, result) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({ status: "fail", message: "Anda sudah mengulas produk ini untuk order tersebut." });
                }
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.status(201).json({ status: "success", message: "Ulasan berhasil ditambahkan", id: result.insertId });
        });
    });
};

// GET Semua Review (publik) - filter by product_id
const getAllReview = (req, res) => {
    const product_id = req.query.product_id || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = `
        SELECT reviews.*, users.name AS reviewer_name
        FROM reviews
        JOIN users ON reviews.user_id = users.id
        WHERE 1=1
    `;
    const queryParams = [];

    if (product_id) {
        query += " AND reviews.product_id = ?";
        queryParams.push(product_id);
    }

    query += " ORDER BY reviews.created_at DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    db.query(query, queryParams, (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Belum ada ulasan." });
        }
        res.status(200).json({ status: "success", page, limit, data: results });
    });
};

// GET Review by ID
const getReviewById = (req, res) => {
    db.query(
        "SELECT reviews.*, users.name AS reviewer_name FROM reviews JOIN users ON reviews.user_id = users.id WHERE reviews.id = ?",
        [req.params.id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            if (results.length === 0) {
                return res.status(404).json({ status: "fail", message: "Ulasan tidak ditemukan" });
            }
            res.status(200).json({ status: "success", data: results[0] });
        }
    );
};

// PUT Edit Review (hanya pemilik, dibatasi 7 hari sejak dibuat)
const EDIT_WINDOW_DAYS = 7;

const updateReview = (req, res) => {
    const { rating, comment } = req.body;

    if (rating !== undefined && (rating < 1 || rating > 5)) {
        return res.status(400).json({ status: "fail", message: "rating harus antara 1-5." });
    }

    db.query("SELECT * FROM reviews WHERE id = ?", [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Ulasan tidak ditemukan" });
        }

        const review = results[0];
        if (review.user_id !== req.user.id) {
            return res.status(403).json({ status: "fail", message: "Anda hanya bisa mengubah ulasan milik Anda sendiri." });
        }

        const daysSinceCreated = (Date.now() - new Date(review.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated > EDIT_WINDOW_DAYS) {
            return res.status(409).json({
                status: "fail",
                message: `Ulasan hanya bisa diedit dalam ${EDIT_WINDOW_DAYS} hari sejak dibuat.`,
            });
        }

        db.query(
            "UPDATE reviews SET rating = ?, comment = ? WHERE id = ?",
            [rating ?? review.rating, comment ?? review.comment, req.params.id],
            (err) => {
                if (err) {
                    return res.status(500).json({ status: "error", message: err.message });
                }
                res.status(200).json({ status: "success", message: "Ulasan berhasil diperbarui" });
            }
        );
    });
};

// DELETE Hapus Review (pemilik atau admin)
const deleteReview = (req, res) => {
    db.query("SELECT * FROM reviews WHERE id = ?", [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Ulasan tidak ditemukan" });
        }

        const review = results[0];
        if (req.user.role !== "admin" && review.user_id !== req.user.id) {
            return res.status(403).json({ status: "fail", message: "Anda hanya bisa menghapus ulasan milik Anda sendiri." });
        }

        db.query("DELETE FROM reviews WHERE id = ?", [req.params.id], (err) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.status(200).json({ status: "success", message: "Ulasan berhasil dihapus" });
        });
    });
};

export { createReview, getAllReview, getReviewById, updateReview, deleteReview };
