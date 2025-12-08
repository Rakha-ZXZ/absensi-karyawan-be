import express from "express";
import {
  generatePayroll,
  getMyPayrollHistory,
  updatePayrollStatus,
  deletePayroll,
  updatePayrollDetails,
  getAllPayrolls,
} from "../controllers/payrollController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

// Admin Route
router.get("/", verifyToken, getAllPayrolls);
router.post("/generate", verifyToken, generatePayroll);
router.put("/:id", verifyToken, updatePayrollDetails);
router.put("/:id/status", verifyToken, updatePayrollStatus);
router.delete("/:id", verifyToken, deletePayroll);

// Employee Route
router.get("/my-history", verifyToken, getMyPayrollHistory);

export default router;