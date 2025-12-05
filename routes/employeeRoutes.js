import express from 'express';
import { getEmployeeProfile,loginEmployee } from '../controllers/employeeController.js';
import verifyToken from '../middlewares/verifyToken.js';


const router = express.Router();

router.get('/profile', verifyToken, getEmployeeProfile);
router.post('/login',loginEmployee)


export default router;