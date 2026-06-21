import express from "express";
import {
    getAllDonasi,
    getDonasiById,
    createDonasi,
    confirmDonasi,
    cancelDonasi,
} from "../controllers/donationController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Semua endpoint donasi butuh login (siapa pun role-nya bisa jadi donor)
router.use(authMiddleware);

router.get("/", getAllDonasi);
router.get("/:id", getDonasiById);
router.post("/", createDonasi);
router.put("/:id/confirm", confirmDonasi);
router.delete("/:id", cancelDonasi);

export default router;
