const getHome = (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Selamat Datang di API EcoCraft - Marketplace Produk Daur Ulang & Kerajinan Limbah",
        version: "1.0.0",
        endpoints: {
            auth: {
                register: "POST /api/auth/register",
                login: "POST /api/auth/login",
                me: "GET /api/auth/me (protected)",
            },
            products: {
                list: "GET /api/products?name=&waste_category=&page=&limit=",
                detail: "GET /api/products/:id",
                create: "POST /api/products (pengrajin terverifikasi)",
                update: "PUT /api/products/:id (owner/admin)",
                delete: "DELETE /api/products/:id (owner/admin)",
            },
            donations: {
                list: "GET /api/donations",
                detail: "GET /api/donations/:id",
                create: "POST /api/donations",
                confirm: "PUT /api/donations/:id/confirm (pengrajin tujuan)",
                cancel: "DELETE /api/donations/:id (donor)",
            },
            cart: {
                view: "GET /api/cart",
                add: "POST /api/cart",
                update: "PUT /api/cart/:id",
                remove: "DELETE /api/cart/:id",
            },
            orders: {
                checkout: "POST /api/orders (pembeli)",
                list: "GET /api/orders",
                detail: "GET /api/orders/:id",
                updateStatus: "PUT /api/orders/:id/status (pengrajin/admin)",
                cancel: "DELETE /api/orders/:id (pembeli, hanya saat pending)",
            },
            challenges: {
                list: "GET /api/challenges",
                detail: "GET /api/challenges/:id (+leaderboard)",
                create: "POST /api/challenges (admin)",
                update: "PUT /api/challenges/:id (admin)",
                delete: "DELETE /api/challenges/:id (admin)",
                join: "POST /api/challenges/:id/join",
                updateProgress: "PUT /api/challenges/:id/progress",
            },
            reviews: {
                list: "GET /api/reviews?product_id=",
                detail: "GET /api/reviews/:id",
                create: "POST /api/reviews (pembeli, order harus selesai)",
                update: "PUT /api/reviews/:id (owner, maks 7 hari)",
                delete: "DELETE /api/reviews/:id (owner/admin)",
            },
            admin: {
                listPengrajin: "GET /api/admin/pengrajin?verified=true|false",
                verifyPengrajin: "PUT /api/admin/pengrajin/:id/verify",
                updateUserStatus: "PATCH /api/admin/users/:id/status",
                deleteUser: "DELETE /api/admin/users/:id",
                stats: "GET /api/admin/stats",
            },
        },
    });
};

export { getHome };
