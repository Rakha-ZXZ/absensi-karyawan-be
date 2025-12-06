// File: api/server.js (Gunakan CommonJS)

// Ganti semua import
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

// Ganti import routes (Asumsikan file routes Anda juga CommonJS atau dapat di-require)
const adminRoutes = require("../routes/adminRoutes.js");
const authRoutes = require("../routes/authRoutes.js");
const employeeRoutes = require("../routes/employeeRoutes.js");
const attendanceRoutes = require("../routes/attendanceRoutes.js");

// Pastikan dotenv.config() dipanggil
dotenv.config();

const app = express();

// --- KONEKSI MONGODB --- (Biarkan seperti ini)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });


// --- MIDDLEWARE CORS PALING ATAS ---
const allowedOrigins = [
  'http://localhost:5173',
  'https://absensi-pekerja-fe.vercel.app',
  // Tambahkan URL Vercel Preview/Development Anda yang spesifik jika ada
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true 
}));

// --- MIDDLEWARE LAINNYA ---
app.use(express.json());
app.use(cookieParser());

// --- ROUTES ---
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/employee",employeeRoutes);
app.use("/api/attendance", attendanceRoutes);


// --- KRITIKAL: EKSPOR COMMONJS UNTUK VERCEL ---
module.exports = app;