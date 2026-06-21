// Dipakai setelah authMiddleware. Contoh: authorize("admin"), authorize("admin", "pengrajin")
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: "fail",
                message: "Anda tidak memiliki akses untuk melakukan aksi ini.",
            });
        }
        next();
    };
};

export { authorize };
