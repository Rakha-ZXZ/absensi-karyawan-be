import express from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

// GET /api/settings - Mengambil pengaturan
router.get("/", verifyToken, getSettings);

// PUT /api/settings - Memperbarui pengaturan (Admin only)
router.put("/", verifyToken, updateSettings);

export default router;
