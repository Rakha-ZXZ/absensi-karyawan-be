import express from "express";
import {loginAdmin, changePasswordAdmin, getAdminProfile } from "../controllers/adminController.js";
import verifyToken from "../middlewares/verifyToken.js";
import { createEmployee, getAllEmployees, deleteEmployee, updateEmployee, getEmployeeCount } from "../controllers/employeeController.js";

const router = express.Router();

router.post("/login",loginAdmin) 
router.put('/change-password', verifyToken, changePasswordAdmin);

router.post('/add-employee', verifyToken, createEmployee);
router.get('/profile', verifyToken, getAdminProfile);
router.put('/update-employee/:id', verifyToken, updateEmployee); // Employee management
router.get("/get-employees", verifyToken, getAllEmployees); // Employee management
router.delete('/delete-employee/:id', verifyToken, deleteEmployee); // Employee management
router.get('/employee-count', verifyToken, getEmployeeCount); // Dashboard stat

export default router;
