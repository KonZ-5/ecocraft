import express from "express";
import { getCart, addToCart, updateCartItem, removeCartItem } from "../controllers/cartController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Cart selalu milik diri sendiri - cukup authMiddleware, ownership otomatis lewat WHERE user_id di query
router.use(authMiddleware);

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:id", updateCartItem);
router.delete("/:id", removeCartItem);

export default router;
