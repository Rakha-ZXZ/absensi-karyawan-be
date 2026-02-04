import asyncHandler from "express-async-handler";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import Payroll from "../models/Payroll.js";
import mongoose from "mongoose";

/**
 * @desc    Menghasilkan (generate) data gaji untuk satu karyawan pada bulan tertentu
 * @route   POST /api/payroll/generate
 * @access  Private (Admin)
 */
export const generatePayroll = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  const { month, year, employeeId } = req.query;

  // 2. Validasi input
  if (!month || !year || !employeeId) {
    res.status(400);
    throw new Error("Parameter 'month', 'year', dan 'employeeId' wajib diisi.");
  }

  const monthInt = parseInt(month, 10);
  const yearInt = parseInt(year, 10);

  if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
    res.status(400);
    throw new Error("Parameter 'month' dan 'year' tidak valid.");
  }

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    res.status(400);
    throw new Error("Parameter 'employeeId' tidak valid.");
  }

  // 3. Tentukan rentang tanggal untuk bulan yang dipilih
  const startDate = new Date(yearInt, monthInt - 1, 1);
  const endDate = new Date(yearInt, monthInt, 0, 23, 59, 59, 999);

  // 4. Ambil karyawan berdasarkan pilihan admin (hanya Aktif/Cuti)
  const employee = await Employee.findOne({
    _id: employeeId,
    status: { $in: ["Aktif", "Cuti"] },
  });
  if (!employee) {
    res.status(404);
    throw new Error("Karyawan tidak ditemukan atau status tidak valid.");
  }

  // 5. Ambil semua data absensi karyawan pada bulan tersebut
  const attendances = await Attendance.find({
    employeeId: employee._id,
    tanggal: { $gte: startDate, $lte: endDate },
  });

  // --- Menghitung Hari Alpha (Tidak Absen) ---
  const HARI_KERJA_ASUMSI = 30; // Asumsi hari kerja dalam sebulan, bisa disesuaikan
  let totalHariAlpha = 0;
  const attendanceDates = new Set(attendances.map(a => new Date(a.tanggal).toDateString()));

  // Loop dari tanggal awal hingga akhir bulan
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    // Cek apakah hari ini adalah hari kerja (Senin-Jumat)
    if (dayOfWeek > 0 && dayOfWeek < 6) {
      // Cek apakah tidak ada catatan absensi pada hari kerja ini
      if (!attendanceDates.has(d.toDateString())) {
        totalHariAlpha++;
      }
    }
  }

  // Hitung rekap absensi
  const attendanceRecap = {
    totalHariHadir: attendances.filter((a) => a.status === "Hadir").length,
    totalHariTerlambat: attendances.filter((a) => a.status === "Terlambat").length,
    totalHariCuti: attendances.filter((a) => a.status === "Cuti").length,
    totalHariAlpha: totalHariAlpha, // Hasil perhitungan Alpha
  };

  // a. Hitung Pendapatan
  const totalTunjangan =
    (employee.tunjanganJabatan || 0) +
    (employee.tunjanganTransport || 0) +
    (employee.tunjanganMakan || 0);
  const pendapatanKotor = (employee.gajiPokok || 0) + totalTunjangan;

  // --- Logika Perhitungan Gaji Baru (Prorata berdasarkan kehadiran) ---

  // b. Hitung total hari yang dibayar (Hadir, Terlambat, Cuti, dll.)
  const totalHariDibayar =
    attendanceRecap.totalHariHadir +
    attendanceRecap.totalHariTerlambat +
    attendanceRecap.totalHariCuti;

  // c. Hitung gaji bersih berdasarkan prorata kehadiran
  const pendapatanPerHari = pendapatanKotor / HARI_KERJA_ASUMSI;
  const gajiBersih = pendapatanPerHari * totalHariDibayar;

  // d. Hitung total potongan sebagai selisihnya
  const totalPotongan = pendapatanKotor - gajiBersih;
  const potonganAbsensi = totalPotongan; // Semua potongan dianggap karena absensi

  // 6. Siapkan data untuk disimpan ke model Payroll
  const payrollData = {
    employeeId: employee._id,
    bulan: monthInt,
    tahun: yearInt,
    gajiPokok: employee.gajiPokok,
    tunjanganJabatan: employee.tunjanganJabatan,
    tunjanganTransport: employee.tunjanganTransport,
    tunjanganMakan: employee.tunjanganMakan,
    totalTunjangan,
    pendapatanKotor,
    potonganAbsensi,
    potonganLain: 0, // Potongan lain akan diisi manual
    totalPotongan,
    gajiBersih,
    detailPerhitungan: attendanceRecap,
    generatedBy: req.user.id,
  };

  // 7. Gunakan findOneAndUpdate dengan 'upsert' untuk membuat atau memperbarui
  // Ini mencegah duplikasi jika admin menjalankan proses ini lebih dari sekali
  const result = await Payroll.findOneAndUpdate(
    { employeeId: employee._id, bulan: monthInt, tahun: yearInt },
    payrollData,
    { new: true, upsert: true, runValidators: true }
  );

  const generatedCount = result.createdAt.getTime() === result.updatedAt.getTime() ? 1 : 0;
  const updatedCount = generatedCount === 1 ? 0 : 1;

  res.status(200).json({
    message: "Proses pembuatan gaji selesai.",
    totalKaryawanDiproses: 1,
    slipGajiDibuat: generatedCount,
    slipGajiDiperbarui: updatedCount,
  });
});

/**
 * @desc    Mengambil riwayat gaji untuk karyawan yang login
 * @route   GET /api/payroll/my-history
 * @access  Private (Employee)
 */
export const getMyPayrollHistory = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  console.log("Backend: getMyPayrollHistory received query:", { month, year }); // DEBUG LOG

  const filter = {
    employeeId: req.user.id,
  };

  if (month && !isNaN(parseInt(month, 10))) {
    filter.bulan = parseInt(month, 10);
    console.log("Backend: Filter by month set to:", filter.bulan); // DEBUG LOG
  }
  if (year && !isNaN(parseInt(year, 10))) {
    filter.tahun = parseInt(year, 10);
    console.log("Backend: Filter by year set to:", filter.tahun); // DEBUG LOG
  }
  console.log("Backend: Final filter applied:", filter); // DEBUG LOG

  const payrolls = await Payroll.find(filter).sort({
    tahun: -1,
    bulan: -1,
  });
  console.log("Backend: Payrolls found (first 5 for brevity):", payrolls.slice(0, 5).map(p => ({ _id: p._id, bulan: p.bulan, tahun: p.tahun, gajiBersih: p.gajiBersih }))); // DEBUG LOG
  res.status(200).json(payrolls);
});

/**
 * @desc    Mengubah status pembayaran slip gaji
 * @route   PUT /api/payroll/:id/status
 * @access  Private (Admin)
 */
export const updatePayrollStatus = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  const { id } = req.params;
  const { status } = req.body;

  // 2. Validasi input status
  const validStatuses = ["Belum Dibayar", "Diproses", "Dibayar"];
  if (!status || !validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Status tidak valid. Gunakan salah satu dari: ${validStatuses.join(', ')}`);
  }

  // 3. Cari data payroll berdasarkan ID
  const payroll = await Payroll.findById(id);

  if (!payroll) {
    res.status(404);
    throw new Error("Data payroll tidak ditemukan.");
  }

  // 4. Update status dan tanggal pembayaran jika statusnya 'Dibayar'
  payroll.statusPembayaran = status;
  payroll.tanggalPembayaran = status === "Dibayar" ? new Date() : null;

  await payroll.save();

  // Ambil kembali data yang sudah di-populate untuk dikirim ke frontend
  const populatedPayroll = await Payroll.findById(id).populate("employeeId", "nama employeeId");

  res.status(200).json({ message: "Status pembayaran berhasil diperbarui.", data: populatedPayroll });
});

/**
 * @desc    Menghapus data payroll
 * @route   DELETE /api/payroll/:id
 * @access  Private (Admin)
 */
export const deletePayroll = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  const { id } = req.params;

  // 2. Validasi ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('ID payroll tidak valid.');
  }

  // 3. Cari dan hapus data payroll
  const payroll = await Payroll.findByIdAndDelete(id);

  if (!payroll) {
    res.status(404);
    throw new Error("Data payroll tidak ditemukan.");
  }

  res.status(200).json({ message: 'Data payroll berhasil dihapus.' });
});

/**
 * @desc    Memperbarui detail slip gaji (potongan lain)
 * @route   PUT /api/payroll/:id
 * @access  Private (Admin)
 */
export const updatePayrollDetails = asyncHandler(async (req, res) => {
  // 1. Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  const { id } = req.params;
  const { potonganLain } = req.body;

  // 2. Cari data payroll berdasarkan ID
  const payroll = await Payroll.findById(id);

  if (!payroll) {
    res.status(404);
    throw new Error("Data payroll tidak ditemukan.");
  }

  // 3. Update field yang diizinkan
  payroll.potonganLain = Number(potonganLain) || 0;

  // 4. Hitung ulang total potongan dan gaji bersih
  payroll.totalPotongan = 
    (payroll.potonganAbsensi || 0) + 
    payroll.potonganLain;
  
  payroll.gajiBersih = payroll.pendapatanKotor - payroll.totalPotongan;

  await payroll.save();

  // 5. Kirim kembali data yang sudah di-populate
  const populatedPayroll = await Payroll.findById(id).populate("employeeId", "nama employeeId");
  res.status(200).json({ message: "Detail gaji berhasil diperbarui.", data: populatedPayroll });
});

/**
 * @desc    Mengambil semua data payroll berdasarkan filter bulan dan tahun
 * @route   GET /api/payroll
 * @access  Private (Admin)
 */
export const getAllPayrolls = asyncHandler(async (req, res) => {
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

  // 3. Query ke database
  const payrolls = await Payroll.find({
    bulan: parseInt(month, 10),
    tahun: parseInt(year, 10),
  })
    .populate("employeeId", "nama employeeId") // Ambil nama dan ID karyawan
    .sort({ "employeeId.nama": 1 }); // Urutkan berdasarkan nama karyawan

  res.status(200).json(payrolls);
});
