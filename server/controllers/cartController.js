import db from "../config/database.js";

// GET Isi Keranjang Milik Sendiri
const getCart = (req, res) => {
    const query = `
        SELECT
            cart.id AS cart_id, cart.qty,
            products.id AS product_id, products.name, products.price, products.image, products.stock,
            products.carbon_saved_kg, products.is_active,
            (products.price * cart.qty) AS subtotal
        FROM cart
        JOIN products ON cart.product_id = products.id
        WHERE cart.user_id = ?
        ORDER BY cart.created_at DESC
    `;

    db.query(query, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }

        const total_price = results.reduce((sum, item) => sum + Number(item.subtotal), 0);
        res.status(200).json({ status: "success", total_price, data: results });
    });
};

// POST Tambah ke Keranjang (kalau produk sudah ada di cart, qty ditambahkan)
const addToCart = (req, res) => {
    const { product_id, qty } = req.body;
    const quantity = qty && qty > 0 ? qty : 1;

    if (!product_id) {
        return res.status(400).json({ status: "fail", message: "product_id wajib diisi." });
    }

    db.query("SELECT * FROM products WHERE id = ? AND is_active = TRUE", [product_id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Produk tidak ditemukan atau tidak aktif." });
        }
        if (results[0].stock < quantity) {
            return res.status(400).json({ status: "fail", message: "Stok produk tidak mencukupi." });
        }

        const upsertQuery = `
            INSERT INTO cart (user_id, product_id, qty)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)
        `;
        db.query(upsertQuery, [req.user.id, product_id, quantity], (err) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.status(201).json({ status: "success", message: "Produk berhasil ditambahkan ke keranjang." });
        });
    });
};

// PUT Update Jumlah Item di Keranjang
const updateCartItem = (req, res) => {
    const { qty } = req.body;

    if (!qty || qty <= 0) {
        return res.status(400).json({ status: "fail", message: "qty wajib diisi dan harus lebih dari 0." });
    }

    db.query(
        "UPDATE cart SET qty = ? WHERE id = ? AND user_id = ?",
        [qty, req.params.id, req.user.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ status: "fail", message: "Item keranjang tidak ditemukan." });
            }
            res.status(200).json({ status: "success", message: "Jumlah item berhasil diperbarui." });
        }
    );
};

// DELETE Hapus Item dari Keranjang
const removeCartItem = (req, res) => {
    db.query("DELETE FROM cart WHERE id = ? AND user_id = ?", [req.params.id, req.user.id], (err, result) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "fail", message: "Item keranjang tidak ditemukan." });
        }
        res.status(200).json({ status: "success", message: "Item berhasil dihapus dari keranjang." });
    });
};

export { getCart, addToCart, updateCartItem, removeCartItem };
