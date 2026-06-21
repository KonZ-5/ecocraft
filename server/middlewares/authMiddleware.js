import { verifyToken } from "../utils/jwt.js";

// Memvalidasi token JWT dari header "Authorization: Bearer <token>"
// Jika valid, req.user akan berisi { id, name, role }
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "fail",
            message: "Token tidak ditemukan. Silakan login terlebih dahulu.",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            status: "fail",
            message: "Token tidak valid atau sudah kedaluwarsa.",
        });
    }
};

export { authMiddleware };
