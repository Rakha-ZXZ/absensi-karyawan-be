import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import adminRoutes from "../routes/adminRoutes.js";
import authRoutes from "../routes/authRoutes.js";
import employeeRoutes from "../routes/employeeRoutes.js"
import attendanceRoutes from "../routes/attendanceRoutes.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

app.use(cors({
  origin: [    
    'https://absensi-pekerja-fe.vercel.app',        
  ],  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser()); // Tambahkan middleware untuk parsing cookie

// Koneksi MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });

  app.get("/", (req, res) => {
  res.send("Backend is Running ✅");
});

// ... (Middleware dan Koneksi MongoDB) ...

// Routes
app.use("/api/admin", adminRoutes); // Tidak perlu require
app.use("/api/auth", authRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);

// Ganti module.exports
export default app;
  