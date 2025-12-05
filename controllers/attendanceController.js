import asyncHandler from "express-async-handler";
import Attendance from "../models/Attendance.js";
import { getDistanceInMeters } from "../utils/locationHelper.js";

/**
 * @desc    Mencatat absensi masuk (check-in) karyawan
 * @route   POST /api/attendance/check-in
 * @access  Private (Employee)
 */
export const checkIn = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah employee
  if (req.user.role !== "employee") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk karyawan.");
  }

  const { latitude, longitude } = req.body;
  const employeeId = req.user.id;

  // 2. Validasi input lokasi dari frontend
  if (!latitude || !longitude) {
    res.status(400);
    throw new Error("Data lokasi (latitude dan longitude) wajib diisi.");
  }

  // 3. Ambil konfigurasi lokasi kantor dari environment variables
  const officeLat = parseFloat(process.env.OFFICE_LATITUDE);
  const officeLon = parseFloat(process.env.OFFICE_LONGITUDE);
  const maxRadius = parseInt(process.env.MAX_ATTENDANCE_RADIUS, 10);

  // 4. Hitung jarak antara karyawan dan kantor
  const distance = getDistanceInMeters(latitude, longitude, officeLat, officeLon);

  // 5. Cek apakah karyawan berada dalam radius yang diizinkan
  if (distance > maxRadius) {
    return res.status(403).json({ message:  `Anda berada ${Math.round(
        distance
      )} meter dari kantor. Absensi hanya bisa dilakukan dalam radius ${maxRadius} meter.` });
  }


  // 6. Cek apakah karyawan sudah absen masuk hari ini
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set waktu ke awal hari

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // Set waktu ke awal hari berikutnya

  const existingAttendance = await Attendance.findOne({
    employeeId,
    // Cari record absensi antara awal hari ini dan awal hari besok
    tanggal: { $gte: today, $lt: tomorrow },
  });

  if (existingAttendance) {
    res.status(400);
    throw new Error("Anda sudah melakukan absensi masuk hari ini.");
  }

  // 7. Tentukan status "Hadir" atau "Terlambat"
  const checkInTime = new Date();
  const onTimeLimit = new Date(today);
  onTimeLimit.setHours(8, 30, 0); // Batas waktu tepat waktu adalah 08:30:00

  const status = checkInTime > onTimeLimit ? "Terlambat" : "Hadir";

  // 8. Buat record absensi baru
  const attendance = await Attendance.create({
    employeeId,
    tanggal: today,
    jamMasuk: checkInTime,
    status,
    keterangan: `Check-in dari lokasi yang valid (${Math.round(
      distance
    )}m dari kantor).`,
  });

  res.status(201).json({
    message: "Absensi masuk berhasil dicatat.",
    data: {
      jamMasuk: attendance.jamMasuk,
      status: attendance.status,
    },
  });
});

/**
 * @desc    Mendapatkan status absensi hari ini untuk karyawan yang login
 * @route   GET /api/attendance/status
 * @access  Private (Employee)
 */
export const getAttendanceStatus = asyncHandler(async (req, res) => {
  // Pastikan yang mengakses adalah employee
  if (req.user.role !== "employee") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk karyawan.");
  }

  const employeeId = req.user.id;

  // Tentukan rentang waktu untuk hari ini
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Cari catatan absensi untuk karyawan ini pada hari ini
  const attendanceRecord = await Attendance.findOne({
    employeeId,
    tanggal: { $gte: today, $lt: tomorrow },
  });

  if (attendanceRecord) {
    // Jika ditemukan, kirim statusnya
    res.status(200).json({
      hasCheckedIn: true,
      ...attendanceRecord.toObject(),
    });
  } else {
    // Jika tidak ditemukan
    res.status(200).json({ hasCheckedIn: false });
  }
});

/**
 * @desc    Mencatat absensi pulang (check-out) karyawan
 * @route   POST /api/attendance/check-out
 * @access  Private (Employee)
 */
export const checkOut = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah employee
  if (req.user.role !== "employee") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk karyawan.");
  }

  const { latitude, longitude } = req.body;
  const employeeId = req.user.id;

  // 2. Validasi input lokasi
  if (!latitude || !longitude) {
    res.status(400);
    throw new Error("Data lokasi (latitude dan longitude) wajib diisi.");
  }

  // 3. Validasi lokasi (sama seperti check-in)
  const officeLat = parseFloat(process.env.OFFICE_LATITUDE);
  const officeLon = parseFloat(process.env.OFFICE_LONGITUDE);
  const maxRadius = parseInt(process.env.MAX_ATTENDANCE_RADIUS, 10);
  const distance = getDistanceInMeters(latitude, longitude, officeLat, officeLon);

  if (distance > maxRadius) {
    res.status(403);
    throw new Error(
      `Anda berada ${Math.round(
        distance
      )} meter dari kantor. Check-out harus dari area kantor.`
    );
  }

  // 4. Cari catatan absensi hari ini
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const attendanceRecord = await Attendance.findOne({
    employeeId,
    tanggal: { $gte: today, $lt: tomorrow },
  });

  // 5. Validasi status absensi
  if (!attendanceRecord) {
    res.status(404);
    throw new Error("Tidak ditemukan catatan absensi masuk hari ini. Anda harus check-in terlebih dahulu.");
  }
  if (attendanceRecord.jamPulang) {
    res.status(400);
    throw new Error("Anda sudah melakukan check-out hari ini.");
  }

  // 6. Update catatan absensi dengan jam pulang
  attendanceRecord.jamPulang = new Date();
  attendanceRecord.keterangan += ` | Check-out dari lokasi yang valid.`;
  const updatedAttendance = await attendanceRecord.save();

  res.status(200).json({
    message: "Check-out berhasil dicatat. Hati-hati di jalan!",
    data: updatedAttendance,
  });
});

/**
 * @desc    Mengambil riwayat absensi untuk karyawan yang sedang login
 * @route   GET /api/attendance/my-history
 * @access  Private (Employee)
 */
export const getMyAttendanceHistory = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah employee
  if (req.user.role !== "employee") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk karyawan.");
  }

  const employeeId = req.user.id;

  // 2. Ambil semua data absensi untuk karyawan tersebut, diurutkan dari yang terbaru
  const history = await Attendance.find({ employeeId }).sort({ tanggal: -1 });

  res.status(200).json(history);
});