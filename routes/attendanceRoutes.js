import express from "express";
import {
  checkIn,
  getAttendanceStatus,
  checkOut,
  getMyAttendanceHistory,
  getPayableDaysCount,
  getMonthlyStatusRecap,
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

router.get("/payable-days-count", verifyToken, getPayableDaysCount);

// @route   GET /api/attendance/monthly-recap
router.get("/monthly-recap", verifyToken, getMonthlyStatusRecap);

export default router;