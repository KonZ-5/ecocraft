import express from "express";
import {
    getAllPengrajin,
    verifyPengrajin,
    getPendingProducts,
    verifyProduct,
    updateUserStatus,
    deleteUser,
    getDashboardStats,
} from "../controllers/adminController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Semua endpoint admin butuh login DAN role admin
router.use(authMiddleware, authorize("admin"));

// Pengelolaan Pengrajin
router.get("/pengrajin", getAllPengrajin);
router.put("/pengrajin/:id/verify", verifyPengrajin);

// Pengelolaan Produk (Baru)
router.get("/products/pending", getPendingProducts);
router.put("/products/:id/verify", verifyProduct);

// Pengelolaan User & Stats
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);
router.get("/stats", getDashboardStats);

export default router;