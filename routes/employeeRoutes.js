import express from 'express';
import { getEmployeeProfile,loginEmployee, changePasswordEmployee } from '../controllers/employeeController.js';
import verifyToken from '../middlewares/verifyToken.js';


const router = express.Router();

router.get('/profile', verifyToken, getEmployeeProfile);
router.put('/change-password', verifyToken, changePasswordEmployee);
router.post('/login',loginEmployee)


export default router;