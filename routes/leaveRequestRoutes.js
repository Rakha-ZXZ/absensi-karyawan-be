import express from "express";
import {
  submitLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  deleteLeaveRequest,
} from "../controllers/leaveRequestController.js";
import verifyToken from "../middlewares/verifyToken.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Employee routes
router.post("/", verifyToken, upload.single("fotoSurat"), submitLeaveRequest);
router.get("/my-requests", verifyToken, getMyLeaveRequests);
router.delete("/:id", verifyToken, deleteLeaveRequest);

// Admin routes
router.get("/all", verifyToken, getAllLeaveRequests);
router.put("/:id/approve", verifyToken, approveLeaveRequest);
router.put("/:id/reject", verifyToken, rejectLeaveRequest);

export default router;
