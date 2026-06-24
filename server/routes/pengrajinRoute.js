import express from "express";
import { getVerifiedPengrajin } from "../controllers/pengrajinController.js";

const router = express.Router();

router.get("/verified", getVerifiedPengrajin);

export default router;