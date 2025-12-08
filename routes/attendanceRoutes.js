import express from "express";
import {
  checkIn,
  getAttendanceStatus,
  checkOut,
  getMyAttendanceHistory,
  getPayableDaysCount,
  getMonthlyStatusRecap,
  getAllAttendanceData,
  getAttendanceByMonth,
  updateAttendance,
  deleteAttendance,
  getTodaysAttendanceActivity,
  getTodaysAttendanceCount,
  getMonthlySummary,
} from "../controllers/attendanceController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

// @route   GET /api/attendance/status
router.get("/status", verifyToken, getAttendanceStatus);

// @route   POST /api/attendance/check-in
router.post("/check-in", verifyToken, checkIn);

// @route   POST /api/attendance/check-out
router.post("/check-out", verifyToken, checkOut);

// @route   GET /api/attendance/my-history
router.get("/my-history", verifyToken, getMyAttendanceHistory);

router.get("/payable-days-count", verifyToken, getPayableDaysCount);

// @route   GET /api/attendance/monthly-recap
router.get("/monthly-recap", verifyToken, getMonthlyStatusRecap);

// @route   GET /api/attendance/all (Admin Only)
router.get("/all", verifyToken, getAllAttendanceData);

// @route   GET /api/attendance/by-month (Admin Only)
router.get("/by-month", verifyToken, getAttendanceByMonth);

// @route   GET /api/attendance/today-activity (Admin Only)
router.get("/today-activity", verifyToken, getTodaysAttendanceActivity);

// @route   GET /api/attendance/today-count (Admin Only)
router.get("/today-count", verifyToken, getTodaysAttendanceCount);

// @route   GET /api/attendance/monthly-summary (Admin Only)
router.get("/monthly-summary", verifyToken, getMonthlySummary);

// @route   PUT /api/attendance/:id (Admin Only)
router.put("/:id", verifyToken, updateAttendance);

// @route   DELETE /api/attendance/:id (Admin Only)
router.delete("/:id", verifyToken, deleteAttendance);

export default router;