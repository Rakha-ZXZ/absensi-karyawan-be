import express from 'express';
import {
  getEmployeeProfile,
  loginEmployee,
  changePasswordEmployee,
  getEmployeeCount,
  getEmployeeSalaryDetails,
} from '../controllers/employeeController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { sendTokenResponse } from '../middlewares/generateToken.js';

const router = express.Router();

router.get('/profile', verifyToken, getEmployeeProfile);
router.put('/change-password', verifyToken, changePasswordEmployee);
router.post('/login', loginEmployee, sendTokenResponse);
// Admin route
router.get('/count', verifyToken, getEmployeeCount);
router.get('/salary-details', verifyToken, getEmployeeSalaryDetails);

export default router;