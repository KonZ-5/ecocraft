import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import homeRoute from "./routes/homeRoute.js";
import authRoute from "./routes/authRoute.js";
import productRoute from "./routes/productRoute.js";
import donationRoute from "./routes/donationRoute.js";
import cartRoute from "./routes/cartRoute.js";
import orderRoute from "./routes/orderRoute.js";
import challengeRoute from "./routes/challengeRoute.js";
import reviewRoute from "./routes/reviewRoute.js";
import adminRoute from "./routes/adminRoute.js";
import pengrajinRoute from "./routes/pengrajinRoute.js";

import { errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Routes =====
app.use("/", homeRoute);
app.use("/api/auth", authRoute);
app.use("/api/products", productRoute);
app.use("/api/donations", donationRoute);
app.use("/api/cart", cartRoute);
app.use("/api/orders", orderRoute);
app.use("/api/challenges", challengeRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/admin", adminRoute);
app.use("/api/pengrajin", pengrajinRoute);

// 404 - endpoint tidak ditemukan
app.use((req, res) => {
    res.status(404).json({ status: "fail", message: "Endpoint tidak ditemukan" });
});

// Error handler global - selalu paling bawah
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
