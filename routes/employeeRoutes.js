import express from 'express';
import { getEmployeeProfile,loginEmployee, changePasswordEmployee } from '../controllers/employeeController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { sendTokenResponse } from '../middlewares/generateToken.js';


const router = express.Router();

router.get('/profile', verifyToken, getEmployeeProfile);
router.put('/change-password', verifyToken, changePasswordEmployee);
router.post('/login', loginEmployee, sendTokenResponse);


export default router;