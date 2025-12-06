const express = require('express');;
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

require('dotenv').config();

const app = express();

app.use(cors({
  origin: [    
    'https://absensi-pekerja-fe.vercel.app',    
    'http://localhost:5000',    
    'http://localhost:5173'
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

console.log('CWD:', process.cwd()); // Current Working Directory
console.log('Trying to load route from:', require.resolve('../routes/authRoutes')); 
// Jika ini gagal, itu menunjukkan masalah jalur.
// Routes
app.use("/api/admin", require("../routes/adminRoutes"));
app.use("/api/auth", require("../routes/authRoutes"));
app.use("/api/employee",require("../routes/employeeRoutes"))
app.use("/api/attendance", require("../routes/attendanceRoutes"));

module.exports = app;
  