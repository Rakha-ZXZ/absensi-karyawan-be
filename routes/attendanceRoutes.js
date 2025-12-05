import express from "express";
import {
  checkIn,
  getAttendanceStatus,
  checkOut,
  getMyAttendanceHistory,
} from "../controllers/attendanceController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

// @route   POST /api/attendance/check-in
router.post("/check-in", verifyToken, checkIn);

// @route   GET /api/attendance/status
router.get("/status", verifyToken, getAttendanceStatus);

// @route   POST /api/attendance/check-out
router.post("/check-out", verifyToken, checkOut);

// @route   GET /api/attendance/my-history
router.get("/my-history", verifyToken, getMyAttendanceHistory);

export default router;