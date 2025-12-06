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

// Middleware CORS
app.use(cors({
  // Izinkan origin spesifik dari frontend Vite Anda
  origin: ['http://localhost:5173','https://absensi-pekerja-fe.vercel.app','https://absensi-pekerja-fe-git-main-afzaals-projects-c2614662.vercel.app/'],
  credentials: true // Penting jika Anda menggunakan cookie/session
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

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/employee",employeeRoutes)
app.use("/api/attendance", attendanceRoutes);



// Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
