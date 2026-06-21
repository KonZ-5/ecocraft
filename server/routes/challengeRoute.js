import express from "express";
import {
    createChallenge,
    getAllChallenge,
    getChallengeById,
    updateChallenge,
    deleteChallenge,
    joinChallenge,
    updateParticipation,
} from "../controllers/challengeController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Publik - bisa dilihat tanpa login
router.get("/", getAllChallenge);
router.get("/:id", getChallengeById);

// Butuh login
router.post("/", authMiddleware, authorize("admin"), createChallenge);
router.put("/:id", authMiddleware, authorize("admin"), updateChallenge);
router.delete("/:id", authMiddleware, authorize("admin"), deleteChallenge);
router.post("/:id/join", authMiddleware, joinChallenge);
router.put("/:id/progress", authMiddleware, updateParticipation);

export default router;
