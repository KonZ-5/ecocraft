import db from "../config/database.js";

const verifyProductOwnership = (req, res, next) => {
    if (req.user.role === "admin") {
        return next();
    }

    const query = `
        SELECT pengrajin_profiles.user_id AS owner_user_id
        FROM products
        JOIN pengrajin_profiles ON products.pengrajin_id = pengrajin_profiles.id
        WHERE products.id = ?
    `;

    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Produk tidak ditemukan" });
        }
        if (results[0].owner_user_id !== req.user.id) {
            return res.status(403).json({
                status: "fail",
                message: "Anda hanya bisa mengubah/menghapus produk milik Anda sendiri.",
            });
        }
        next();
    });
};

export { verifyProductOwnership };
