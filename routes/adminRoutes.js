import express from "express";
import {loginAdmin } from "../controllers/adminController.js";
import verifyToken from "../middlewares/verifyToken.js";
import { createEmployee, getAllEmployees, deleteEmployee, updateEmployee } from "../controllers/employeeController.js";

const router = express.Router();

router.post("/login",loginAdmin) 

router.post('/add-employee', verifyToken, createEmployee);
router.put('/update-employee/:id', verifyToken, updateEmployee);
router.get("/get-employees", verifyToken, getAllEmployees)
router.delete('/delete-employee/:id', verifyToken, deleteEmployee);

export default router;
