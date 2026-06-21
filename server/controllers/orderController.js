import db, { promisePool } from "../config/database.js";

// Poin reward dasar untuk pembeli setelah order selesai (dibulatkan dari total carbon saved)
const calculateOrderEcoPoints = (totalCarbonSaved) => Math.round(Number(totalCarbonSaved) * 2);

// POST Checkout - ubah isi cart jadi order, kurangi stok, kosongkan cart
// Pakai transaction supaya semua langkah atomik (semua berhasil atau semua dibatalkan)
const createOrder = async (req, res) => {
    const { shipping_address } = req.body;

    if (!shipping_address) {
        return res.status(400).json({ status: "fail", message: "shipping_address wajib diisi." });
    }

    const connection = await promisePool.getConnection();

    try {
        await connection.beginTransaction();

        const [cartItems] = await connection.query(
            `SELECT cart.id AS cart_id, cart.product_id, cart.qty,
                    products.price, products.stock, products.carbon_saved_kg, products.is_active
             FROM cart
             JOIN products ON cart.product_id = products.id
             WHERE cart.user_id = ?
             FOR UPDATE`,
            [req.user.id]
        );

        if (cartItems.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ status: "fail", message: "Keranjang Anda kosong." });
        }

        for (const item of cartItems) {
            if (!item.is_active) {
                await connection.rollback();
                connection.release();
                return res.status(409).json({
                    status: "fail",
                    message: `Produk dengan id ${item.product_id} sudah tidak aktif/tersedia.`,
                });
            }
            if (item.stock < item.qty) {
                await connection.rollback();
                connection.release();
                return res.status(409).json({
                    status: "fail",
                    message: `Stok produk dengan id ${item.product_id} tidak mencukupi.`,
                });
            }
        }

        const totalPrice = cartItems.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
        const totalCarbonSaved = cartItems.reduce((sum, item) => sum + Number(item.carbon_saved_kg) * item.qty, 0);

        const [orderResult] = await connection.query(
            "INSERT INTO orders (buyer_id, total_price, total_carbon_saved, shipping_address) VALUES (?, ?, ?, ?)",
            [req.user.id, totalPrice, totalCarbonSaved, shipping_address]
        );
        const orderId = orderResult.insertId;

        for (const item of cartItems) {
            await connection.query(
                "INSERT INTO order_items (order_id, product_id, qty, price, carbon_saved_kg) VALUES (?, ?, ?, ?, ?)",
                [orderId, item.product_id, item.qty, item.price, item.carbon_saved_kg]
            );
            await connection.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.qty, item.product_id]);
        }

        await connection.query("DELETE FROM cart WHERE user_id = ?", [req.user.id]);

        await connection.commit();
        connection.release();

        res.status(201).json({
            status: "success",
            message: "Checkout berhasil",
            data: { id: orderId, total_price: totalPrice, total_carbon_saved: totalCarbonSaved, status: "pending" },
        });
    } catch (err) {
        await connection.rollback();
        connection.release();
        res.status(500).json({ status: "error", message: err.message });
    }
};

// GET Semua Order
// - admin: lihat semua
// - pembeli: hanya order miliknya
// - pengrajin: hanya order yang berisi produk miliknya
const getAllOrder = (req, res) => {
    const status = req.query.status || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = `SELECT DISTINCT orders.* FROM orders`;
    const queryParams = [];
    let whereClause = " WHERE 1=1";

    if (req.user.role === "pembeli") {
        whereClause += " AND orders.buyer_id = ?";
        queryParams.push(req.user.id);
    } else if (req.user.role === "pengrajin") {
        query += `
            JOIN order_items ON orders.id = order_items.order_id
            JOIN products ON order_items.product_id = products.id
            JOIN pengrajin_profiles ON products.pengrajin_id = pengrajin_profiles.id
        `;
        whereClause += " AND pengrajin_profiles.user_id = ?";
        queryParams.push(req.user.id);
    }

    if (status) {
        whereClause += " AND orders.status = ?";
        queryParams.push(status);
    }

    query += whereClause + " ORDER BY orders.created_at DESC LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    db.query(query, queryParams, (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Order tidak ditemukan" });
        }
        res.status(200).json({ status: "success", page, limit, data: results });
    });
};

// GET Order Berdasarkan ID (beserta item-itemnya)
const getOrderById = (req, res) => {
    db.query("SELECT * FROM orders WHERE id = ?", [req.params.id], (err, orderResults) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (orderResults.length === 0) {
            return res.status(404).json({ status: "fail", message: "Order tidak ditemukan" });
        }

        const order = orderResults[0];

        const itemsQuery = `
            SELECT order_items.*, products.name AS product_name, pengrajin_profiles.user_id AS pengrajin_user_id
            FROM order_items
            JOIN products ON order_items.product_id = products.id
            JOIN pengrajin_profiles ON products.pengrajin_id = pengrajin_profiles.id
            WHERE order_items.order_id = ?
        `;
        db.query(itemsQuery, [req.params.id], (err, items) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }

            const isBuyer = order.buyer_id === req.user.id;
            const isRelatedPengrajin = items.some((i) => i.pengrajin_user_id === req.user.id);

            if (req.user.role !== "admin" && !isBuyer && !isRelatedPengrajin) {
                return res.status(403).json({ status: "fail", message: "Anda tidak punya akses ke order ini." });
            }

            res.status(200).json({ status: "success", data: { ...order, items } });
        });
    });
};

// PUT Update Status Order (khusus pengrajin terkait produk dalam order, atau admin)
// Alur: pending -> dikemas -> dikirim -> selesai (otomatis kasih eco points ke buyer saat 'selesai')
const updateOrderStatus = (req, res) => {
    const { status } = req.body;
    const allowedStatus = ["dikemas", "dikirim", "selesai", "dibatalkan"];

    if (!status || !allowedStatus.includes(status)) {
        return res.status(400).json({ status: "fail", message: `Status wajib salah satu dari: ${allowedStatus.join(", ")}` });
    }

    db.query("SELECT * FROM orders WHERE id = ?", [req.params.id], (err, orderResults) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (orderResults.length === 0) {
            return res.status(404).json({ status: "fail", message: "Order tidak ditemukan" });
        }

        const order = orderResults[0];

        if (order.status === "selesai" || order.status === "dibatalkan") {
            return res.status(409).json({ status: "fail", message: `Order sudah berstatus '${order.status}', tidak bisa diubah lagi.` });
        }

        const verifyAndUpdate = () => {
            db.query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id], (err) => {
                if (err) {
                    return res.status(500).json({ status: "error", message: err.message });
                }

                if (status !== "selesai") {
                    return res.status(200).json({ status: "success", message: `Status order berhasil diubah menjadi '${status}'` });
                }

                const ecoPoints = calculateOrderEcoPoints(order.total_carbon_saved);
                db.query("UPDATE users SET eco_points = eco_points + ? WHERE id = ?", [ecoPoints, order.buyer_id], (err) => {
                    if (err) {
                        return res.status(500).json({ status: "error", message: err.message });
                    }
                    res.status(200).json({
                        status: "success",
                        message: "Order selesai. Eco Points pembeli telah ditambahkan.",
                        eco_points_diberikan: ecoPoints,
                    });
                });
            });
        };

        if (req.user.role === "admin") {
            return verifyAndUpdate();
        }

        // pengrajin: pastikan dia punya minimal 1 produk di order ini
        const checkQuery = `
            SELECT 1 FROM order_items
            JOIN products ON order_items.product_id = products.id
            JOIN pengrajin_profiles ON products.pengrajin_id = pengrajin_profiles.id
            WHERE order_items.order_id = ? AND pengrajin_profiles.user_id = ?
            LIMIT 1
        `;
        db.query(checkQuery, [req.params.id, req.user.id], (err, results) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            if (results.length === 0) {
                return res.status(403).json({ status: "fail", message: "Anda tidak punya produk di order ini." });
            }
            verifyAndUpdate();
        });
    });
};

// DELETE/Batalkan Order (khusus pembeli pemilik, hanya boleh selama status 'pending')
const cancelOrder = (req, res) => {
    db.query("SELECT * FROM orders WHERE id = ?", [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Order tidak ditemukan" });
        }

        const order = results[0];

        if (req.user.role !== "admin" && order.buyer_id !== req.user.id) {
            return res.status(403).json({ status: "fail", message: "Anda hanya bisa membatalkan order milik Anda sendiri." });
        }
        if (order.status !== "pending") {
            return res.status(409).json({ status: "fail", message: "Order yang sudah diproses tidak bisa dibatalkan." });
        }

        db.query("UPDATE orders SET status = 'dibatalkan' WHERE id = ?", [req.params.id], async (err) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            // kembalikan stok produk yang sempat dikurangi saat checkout
            try {
                const [items] = await promisePool.query("SELECT product_id, qty FROM order_items WHERE order_id = ?", [req.params.id]);
                for (const item of items) {
                    await promisePool.query("UPDATE products SET stock = stock + ? WHERE id = ?", [item.qty, item.product_id]);
                }
                res.status(200).json({ status: "success", message: "Order berhasil dibatalkan, stok dikembalikan." });
            } catch (stockErr) {
                res.status(500).json({ status: "error", message: stockErr.message });
            }
        });
    });
};

export { createOrder, getAllOrder, getOrderById, updateOrderStatus, cancelOrder };
