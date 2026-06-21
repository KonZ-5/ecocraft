import express from "express";
import {
    getAllProduk,
    getProdukById,
    createProduk,
    updateProduk,
    deleteProduk,
} from "../controllers/productController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { verifyProductOwnership } from "../middlewares/productOwnership.js";

const router = express.Router();

router.get("/", getAllProduk);
router.get("/:id", getProdukById);
router.post("/", authMiddleware, authorize("pengrajin"), createProduk);
router.put("/:id", authMiddleware, authorize("pengrajin", "admin"), verifyProductOwnership, updateProduk);
router.delete("/:id", authMiddleware, authorize("pengrajin", "admin"), verifyProductOwnership, deleteProduk);

export default router;
