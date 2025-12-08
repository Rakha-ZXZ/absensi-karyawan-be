import asyncHandler from "express-async-handler";
import Attendance from "../models/Attendance.js";
import mongoose from "mongoose";
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

/**
 * @desc    Mengambil jumlah hari kerja yang dibayar (Hadir, Terlambat, Cuti) di bulan berjalan
 * @route   GET /api/attendance/payable-days-count
 * @access  Private (Employee)
 */
export const getPayableDaysCount = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah employee
  if (req.user.role !== "employee") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk karyawan.");
  }

  const employeeId = req.user.id;

  // 2. Tentukan rentang waktu untuk bulan ini
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  // 3. Definisikan status yang dihitung sebagai hari kerja yang dibayar
  const payableStatuses = ["Hadir", "Terlambat", "Cuti"];

  // 4. Hitung dokumen yang cocok menggunakan countDocuments untuk efisiensi
  const payableDaysCount = await Attendance.countDocuments({
    employeeId,
    tanggal: { $gte: startOfMonth, $lte: endOfMonth },
    status: { $in: payableStatuses },
  });

  // 5. Kirim hasilnya
  res.status(200).json({ payableDaysCount });
});

/**
 * @desc    Mengambil total jumlah absensi (semua status) di bulan berjalan
 * @route   GET /api/attendance/monthly-recap
 * @access  Private (Employee)
 */
export const getMonthlyStatusRecap = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah employee
  if (req.user.role !== "employee") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk karyawan.");
  }

  const employeeId = req.user.id;

  // 2. Tentukan rentang waktu untuk bulan ini
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  // 3. Gunakan Aggregation Pipeline untuk menghitung jumlah per status
  const statusCounts = await Attendance.aggregate([
    {
      $match: {
        employeeId: new mongoose.Types.ObjectId(employeeId),
        tanggal: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    {
      $group: {
        _id: "$status", // Kelompokkan berdasarkan kolom 'status'
        count: { $sum: 1 }, // Hitung jumlah dokumen di setiap kelompok
      },
    },
  ]);

  // 4. Format hasil agar mudah digunakan di frontend
  const result = {};
  statusCounts.forEach((item) => {
    result[item._id] = item.count;
  });

  // 5. Kirim hasilnya
  res.status(200).json(result);
});

/**
 * @desc    Mengambil semua data absensi untuk semua karyawan (Admin only)
 * @route   GET /api/admin/all-attendance
 * @access  Private (Admin)
 */
export const getAllAttendanceData = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  // 2. Ambil semua data absensi, gabungkan dengan data nama karyawan, dan urutkan
  const allAttendance = await Attendance.find({})
    .populate("employeeId", "nama email employeeId") // Mengambil 'nama', 'email', dan 'employeeId' dari model Employee
    .sort({ tanggal: -1 }); // Urutkan dari yang terbaru

  res.status(200).json(allAttendance);
});

/**
 * @desc    Mengambil data absensi berdasarkan bulan dan tahun (Admin only)
 * @route   GET /api/admin/attendance-by-month?month=M&year=YYYY
 * @access  Private (Admin)
 */
export const getAttendanceByMonth = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  const { month, year } = req.query;

  // 2. Validasi input query
  if (!month || !year) {
    res.status(400);
    throw new Error("Parameter 'month' dan 'year' wajib diisi.");
  }

  const monthInt = parseInt(month, 10);
  const yearInt = parseInt(year, 10);

  // 3. Buat rentang tanggal untuk query database
  // Bulan di JavaScript Date adalah 0-11, jadi kita kurangi 1
  const startDate = new Date(yearInt, monthInt - 1, 1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(yearInt, monthInt, 1);
  endDate.setHours(0, 0, 0, 0);

  // 4. Ambil data absensi dalam rentang tanggal yang ditentukan
  const attendanceInMonth = await Attendance.find({
    tanggal: {
      $gte: startDate,
      $lt: endDate,
    },
  })
    .populate("employeeId", "nama email employeeId jabatan") // Ambil juga jabatan
    .sort({ tanggal: -1 });

  res.status(200).json(attendanceInMonth);
});

/**
 * @desc    Memperbarui data absensi (Admin only)
 * @route   PUT /api/attendance/:id
 * @access  Private (Admin)
 */
export const updateAttendance = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  const { id } = req.params;
  const { tanggal, jamMasuk, jamPulang, status } = req.body;

  // 2. Validasi ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('ID absensi tidak valid.');
  }

  // 3. Buat objek yang berisi field yang akan diupdate
  const updateData = {};
  if (tanggal) updateData.tanggal = tanggal;
  if (jamMasuk) updateData.jamMasuk = jamMasuk;
  // Memungkinkan untuk mengosongkan jam pulang dengan mengirim null atau string kosong
  if (jamPulang || jamPulang === null || jamPulang === '') {
    updateData.jamPulang = jamPulang || null;
  }
  if (status) updateData.status = status;

  // 4. Cari dan perbarui data dalam satu operasi atomik
  // Opsi { new: true } memastikan dokumen yang dikembalikan adalah versi setelah di-update
  const updatedAttendance = await Attendance.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate("employeeId", "nama email employeeId"); // Langsung populate di sini

  // 5. Cek apakah dokumen ditemukan dan berhasil diupdate
  if (!updatedAttendance) {
    res.status(404);
    throw new Error("Data absensi tidak ditemukan.");
  }

  // 6. Kirim respons dengan data yang sudah di-populate
  res.status(200).json({ message: 'Data absensi berhasil diperbarui.', data: updatedAttendance });
});

/**
 * @desc    Menghapus data absensi (Admin only)
 * @route   DELETE /api/attendance/:id
 * @access  Private (Admin)
 */
export const deleteAttendance = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  const { id } = req.params;

  // 2. Validasi ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('ID absensi tidak valid.');
  }

  // 3. Cari dan hapus data absensi menggunakan findByIdAndDelete
  const attendance = await Attendance.findByIdAndDelete(id);

  // 4. Jika data tidak ditemukan, kirim error 404
  if (!attendance) {
    res.status(404);
    throw new Error("Data absensi tidak ditemukan.");
  }

  // 5. Kirim respons sukses
  res.status(200).json({ message: 'Data absensi berhasil dihapus.' });
});

/**
 * @desc    Mengambil semua aktivitas absensi hari ini (Admin only)
 * @route   GET /api/attendance/today-activity
 * @access  Private (Admin)
 */
export const getTodaysAttendanceActivity = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  // 2. Tentukan rentang waktu untuk hari ini
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // 3. Ambil semua data absensi hari ini, gabungkan dengan data nama karyawan, dan urutkan
  const todaysAttendance = await Attendance.find({
    tanggal: {
      $gte: startOfDay,
      $lt: endOfDay,
    },
  })
    .populate("employeeId", "nama employeeId") // Mengambil 'nama' dan 'employeeId' dari model Employee
    .sort({ createdAt: -1 }); // Urutkan berdasarkan waktu dibuat (check-in terbaru di atas)

  res.status(200).json(todaysAttendance);
});

/**
 * @desc    Menghitung jumlah karyawan yang sudah absen hari ini (Admin only)
 * @route   GET /api/attendance/today-count
 * @access  Private (Admin)
 */
export const getTodaysAttendanceCount = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  // 2. Tentukan rentang waktu untuk hari ini
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // 3. Hitung jumlah dokumen absensi hari ini menggunakan countDocuments untuk efisiensi
  const count = await Attendance.countDocuments({
    tanggal: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  // 4. Kirim respons dengan jumlahnya
  res.status(200).json({ count });
});

/**
 * @desc    Mengambil rekapitulasi jumlah status absensi (Hadir, Terlambat, Cuti) bulan ini untuk semua karyawan (Admin only)
 * @route   GET /api/attendance/monthly-summary
 * @access  Private (Admin)
 */
export const getMonthlySummary = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  // 2. Tentukan rentang waktu untuk bulan ini
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  // 3. Gunakan Aggregation Pipeline untuk menghitung jumlah per status
  const statusCounts = await Attendance.aggregate([
    {
      $match: {
        tanggal: { $gte: startOfMonth, $lte: endOfMonth },
        status: { $in: ["Hadir", "Terlambat", "Cuti"] },
      },
    },
    {
      $group: {
        _id: "$status", // Kelompokkan berdasarkan kolom 'status'
        count: { $sum: 1 }, // Hitung jumlah dokumen di setiap kelompok
      },
    },
  ]);

  // 4. Format hasil agar mudah digunakan di frontend, termasuk default 0
  const result = { Hadir: 0, Terlambat: 0, Cuti: 0 };
  statusCounts.forEach((item) => {
    result[item._id] = item.count;
  });

  // 5. Kirim hasilnya
  res.status(200).json(result);
});