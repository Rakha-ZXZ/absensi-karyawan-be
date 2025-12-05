import express from "express";
import { checkAuthStatus,logout } from "../controllers/authController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/check-status",verifyToken,checkAuthStatus)
router.post("/logout",verifyToken,logout)   
export default router;