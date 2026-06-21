import express from "express";
import {
    createReview,
    getAllReview,
    getReviewById,
    updateReview,
    deleteReview,
} from "../controllers/reviewController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Publik
router.get("/", getAllReview);
router.get("/:id", getReviewById);

// Butuh login
router.post("/", authMiddleware, authorize("pembeli"), createReview);
router.put("/:id", authMiddleware, updateReview);
router.delete("/:id", authMiddleware, deleteReview);

export default router;
