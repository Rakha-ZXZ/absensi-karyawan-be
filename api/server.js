import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import adminRoutes from "../routes/adminRoutes.js";
import authRoutes from "../routes/authRoutes.js";
import employeeRoutes from "../routes/employeeRoutes.js";
import attendanceRoutes from "../routes/attendanceRoutes.js";
import cookieParser from "cookie-parser";

// Pastikan dotenv.config() dipanggil
dotenv.config();

const app = express();

// --- 1. KONEKSI MONGODB DILAKUKAN HANYA SEKALI ---
// Koneksi MongoDB harus dilakukan di luar handler Express jika memungkinkan,
// atau dilakukan secara lazy. Untuk Vercel, kita biarkan saja di sini 
// asalkan koneksi ditangani dengan baik (re-use connection).
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });


// --- 2. MIDDLEWARE CORS DITARUH PALING ATAS ---
// Pastikan ini ditaruh sebelum middleware lainnya
const allowedOrigins = [
  'http://localhost:5173',
  'https://absensi-pekerja-fe.vercel.app',
  // Tambahkan URL Vercel Preview/Development Anda juga jika ada (tanpa trailing slash)
  // Contoh: 'https://absensi-pekerja-fe-git-main-afzaals-projects-c2614662.vercel.app' 
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true // Penting jika Anda menggunakan cookie/session
}));

// --- 3. MIDDLEWARE LAINNYA ---
app.use(express.json());
app.use(cookieParser());

// --- 4. ROUTES ---
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/employee",employeeRoutes);
app.use("/api/attendance", attendanceRoutes);

// --- 5. HAPUS app.listen & EKSPOR APLIKASI UNTUK VERCEL ---

// JIKA MENGGUNAKAN ES MODULES (import/export), gunakan:
export default app;

// JIKA MENGGUNAKAN COMMONJS (require/module.exports), gunakan:
// module.exports = app;

// JANGAN gunakan app.listen() di file ini, karena Vercel yang akan menjalankan serverless function.