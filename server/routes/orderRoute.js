import express from "express";
import {
    createOrder,
    getAllOrder,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", authorize("pembeli"), createOrder);
router.get("/", getAllOrder);
router.get("/:id", getOrderById);
router.put("/:id/status", authorize("pengrajin", "admin"), updateOrderStatus);
router.delete("/:id", cancelOrder);

export default router;
