import db from "../config/database.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";

// POST Register - akun publik hanya boleh daftar sebagai 'pembeli' atau 'pengrajin'
// Akun 'admin' tidak bisa dibuat lewat endpoint ini demi keamanan
const register = (req, res) => {
    const { name, email, password, role, workshop_name, description } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ status: "fail", message: "Nama, email, dan password wajib diisi." });
    }

    if (password.length < 6) {
        return res.status(400).json({ status: "fail", message: "Password minimal 6 karakter." });
    }

    const finalRole = role === "pengrajin" ? "pengrajin" : "pembeli";

    if (finalRole === "pengrajin" && !workshop_name) {
        return res.status(400).json({ status: "fail", message: "Nama workshop wajib diisi untuk akun pengrajin." });
    }

    db.query("SELECT id FROM users WHERE email = ?", [email], (err, existing) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (existing.length > 0) {
            return res.status(409).json({ status: "fail", message: "Email sudah terdaftar." });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const insertUserQuery = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

        db.query(insertUserQuery, [name, email, hashedPassword, finalRole], (err, result) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }

            const userId = result.insertId;

            if (finalRole === "pengrajin") {
                const insertProfileQuery =
                    "INSERT INTO pengrajin_profiles (user_id, workshop_name, description) VALUES (?, ?, ?)";
                db.query(insertProfileQuery, [userId, workshop_name, description || null], (err) => {
                    if (err) {
                        return res.status(500).json({ status: "error", message: err.message });
                    }
                    return res.status(201).json({
                        status: "success",
                        message: "Registrasi pengrajin berhasil. Akun Anda menunggu verifikasi admin sebelum bisa mengunggah produk.",
                    });
                });
            } else {
                return res.status(201).json({ status: "success", message: "Registrasi berhasil. Silakan login." });
            }
        });
    });
};

// POST Login
const login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ status: "fail", message: "Email dan password wajib diisi." });
    }

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(401).json({ status: "fail", message: "Email atau password salah." });
        }

        const user = results[0];

        if (user.status === "suspended") {
            return res.status(403).json({ status: "fail", message: "Akun Anda telah ditangguhkan. Hubungi admin." });
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: "fail", message: "Email atau password salah." });
        }

        const token = generateToken({ id: user.id, name: user.name, role: user.role });

        res.status(200).json({
            status: "success",
            message: "Login berhasil",
            token,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                eco_points: user.eco_points,
            },
        });
    });
};

// GET Profil milik sendiri (protected route - butuh token)
const getMe = (req, res) => {
    const query =
        "SELECT id, name, email, role, photo, address, eco_points, status, created_at FROM users WHERE id = ?";

    db.query(query, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ status: "fail", message: "Pengguna tidak ditemukan." });
        }

        const user = results[0];

        if (user.role !== "pengrajin") {
            return res.status(200).json({ status: "success", data: user });
        }

        db.query("SELECT * FROM pengrajin_profiles WHERE user_id = ?", [req.user.id], (err, profileResults) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.status(200).json({
                status: "success",
                data: { ...user, pengrajin_profile: profileResults[0] || null },
            });
        });
    });
};

export { register, login, getMe };
