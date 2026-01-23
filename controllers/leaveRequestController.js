import asyncHandler from "express-async-handler";
import LeaveRequest from "../models/LeaveRequest.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";

/**
 * @desc    Mengajukan cuti (Employee)
 * @route   POST /api/leave-requests
 * @access  Private (Employee)
 */
export const submitLeaveRequest = asyncHandler(async (req, res) => {
  // Pastikan yang mengakses adalah employee
  if (req.user.role !== "employee") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk karyawan.");
  }

  const { tanggalMulai, tanggalSelesai, alasan } = req.body;
  const employeeId = req.user.id;

  // Validasi input
  if (!tanggalMulai || !tanggalSelesai || !alasan) {
    res.status(400);
    throw new Error("Tanggal mulai, tanggal selesai, dan alasan wajib diisi.");
  }

  // Validasi tanggal
  const startDate = new Date(tanggalMulai);
  const endDate = new Date(tanggalSelesai);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    res.status(400);
    throw new Error("Tanggal mulai tidak boleh di masa lalu.");
  }

  if (endDate < startDate) {
    res.status(400);
    throw new Error("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
  }

  // Hitung jumlah hari
  const diffTime = Math.abs(endDate - startDate);
  const jumlahHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Ambil path foto surat jika ada
  const fotoSurat = req.file ? `/uploads/leave-requests/${req.file.filename}` : null;

  // Buat pengajuan cuti
  const leaveRequest = await LeaveRequest.create({
    employeeId,
    tanggalMulai: startDate,
    tanggalSelesai: endDate,
    jumlahHari,
    alasan,
    fotoSurat,
  });

  res.status(201).json({
    message: "Pengajuan cuti berhasil dikirim. Menunggu persetujuan admin.",
    data: leaveRequest,
  });
});

/**
 * @desc    Mendapatkan semua pengajuan cuti karyawan yang login
 * @route   GET /api/leave-requests/my-requests
 * @access  Private (Employee)
 */
export const getMyLeaveRequests = asyncHandler(async (req, res) => {
  // Pastikan yang mengakses adalah employee
  if (req.user.role !== "employee") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk karyawan.");
  }

  const employeeId = req.user.id;

  const requests = await LeaveRequest.find({ employeeId })
    .populate("disetujuiOleh", "nama")
    .sort({ createdAt: -1 });

  res.status(200).json(requests);
});

/**
 * @desc    Mendapatkan semua pengajuan cuti (Admin)
 * @route   GET /api/leave-requests/all
 * @access  Private (Admin)
 */
export const getAllLeaveRequests = asyncHandler(async (req, res) => {
  // Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  const { status } = req.query;

  let query = {};
  if (status && status !== "Semua") {
    query.status = status;
  }

  const requests = await LeaveRequest.find(query)
    .populate("employeeId", "nama employeeId email")
    .populate("disetujuiOleh", "nama")
    .sort({ createdAt: -1 });

  res.status(200).json(requests);
});

/**
 * @desc    Menyetujui pengajuan cuti (Admin)
 * @route   PUT /api/leave-requests/:id/approve
 * @access  Private (Admin)
 */
export const approveLeaveRequest = asyncHandler(async (req, res) => {
  // Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  const { id } = req.params;
  const { keteranganAdmin } = req.body;
  const adminId = req.user.id;

  // Cari pengajuan cuti
  const leaveRequest = await LeaveRequest.findById(id).populate("employeeId");

  if (!leaveRequest) {
    res.status(404);
    throw new Error("Pengajuan cuti tidak ditemukan.");
  }

  if (leaveRequest.status !== "Pending") {
    res.status(400);
    throw new Error(`Pengajuan cuti sudah ${leaveRequest.status}.`);
  }

  // Update status pengajuan
  leaveRequest.status = "Disetujui";
  leaveRequest.keteranganAdmin = keteranganAdmin || "Disetujui";
  leaveRequest.disetujuiOleh = adminId;
  leaveRequest.tanggalDisetujui = new Date();
  await leaveRequest.save();

  // Buat catatan absensi cuti untuk setiap hari
  const startDate = new Date(leaveRequest.tanggalMulai);
  const endDate = new Date(leaveRequest.tanggalSelesai);

  const attendancePromises = [];
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const cutiDate = new Date(date);
    cutiDate.setHours(0, 0, 0, 0);

    // Cek apakah sudah ada absensi pada tanggal tersebut
    const existingAttendance = await Attendance.findOne({
      employeeId: leaveRequest.employeeId._id,
      tanggal: {
        $gte: cutiDate,
        $lt: new Date(cutiDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!existingAttendance) {
      // Set jam masuk dan jam pulang otomatis untuk cuti
      const jamMasukCuti = new Date(cutiDate);
      jamMasukCuti.setHours(8, 0, 0, 0);
      
      const jamPulangCuti = new Date(cutiDate);
      jamPulangCuti.setHours(17, 0, 0, 0);
      
      attendancePromises.push(
        Attendance.create({
          employeeId: leaveRequest.employeeId._id,
          tanggal: cutiDate,
          jamMasuk: jamMasukCuti,
          jamPulang: jamPulangCuti,
          status: "Cuti",
          keterangan: `Cuti disetujui: ${leaveRequest.alasan}`,
        })
      );
    }
  }

  await Promise.all(attendancePromises);

  // Update status karyawan menjadi Cuti
  const employee = leaveRequest.employeeId;
  employee.status = "Cuti";
  await employee.save();

  res.status(200).json({
    message: `Pengajuan cuti ${employee.nama} berhasil disetujui.`,
    data: leaveRequest,
  });
});

/**
 * @desc    Menolak pengajuan cuti (Admin)
 * @route   PUT /api/leave-requests/:id/reject
 * @access  Private (Admin)
 */
export const rejectLeaveRequest = asyncHandler(async (req, res) => {
  // Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  const { id } = req.params;
  const { keteranganAdmin } = req.body;
  const adminId = req.user.id;

  // Cari pengajuan cuti
  const leaveRequest = await LeaveRequest.findById(id).populate("employeeId", "nama");

  if (!leaveRequest) {
    res.status(404);
    throw new Error("Pengajuan cuti tidak ditemukan.");
  }

  if (leaveRequest.status !== "Pending") {
    res.status(400);
    throw new Error(`Pengajuan cuti sudah ${leaveRequest.status}.`);
  }

  // Update status pengajuan
  leaveRequest.status = "Ditolak";
  leaveRequest.keteranganAdmin = keteranganAdmin || "Ditolak";
  leaveRequest.disetujuiOleh = adminId;
  leaveRequest.tanggalDisetujui = new Date();
  await leaveRequest.save();

  res.status(200).json({
    message: `Pengajuan cuti ${leaveRequest.employeeId.nama} berhasil ditolak.`,
    data: leaveRequest,
  });
});

/**
 * @desc    Menghapus pengajuan cuti (Employee - hanya yang pending, Admin - semua)
 * @route   DELETE /api/leave-requests/:id
 * @access  Private (Employee/Admin)
 */
export const deleteLeaveRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Cari pengajuan cuti
  const leaveRequest = await LeaveRequest.findById(id).populate("employeeId", "nama");

  if (!leaveRequest) {
    res.status(404);
    throw new Error("Pengajuan cuti tidak ditemukan.");
  }

  // Validasi: Employee hanya bisa hapus pengajuan sendiri yang masih pending
  if (userRole === "employee") {
    if (leaveRequest.employeeId._id.toString() !== userId) {
      res.status(403);
      throw new Error("Anda tidak memiliki akses untuk menghapus pengajuan ini.");
    }
    if (leaveRequest.status !== "Pending") {
      res.status(400);
      throw new Error("Hanya pengajuan dengan status Pending yang bisa dihapus.");
    }
  }

  // Admin bisa hapus semua pengajuan
  // Jika pengajuan sudah disetujui, hapus juga catatan absensi terkait
  if (leaveRequest.status === "Disetujui") {
    const startDate = new Date(leaveRequest.tanggalMulai);
    const endDate = new Date(leaveRequest.tanggalSelesai);

    // Hapus semua catatan absensi cuti dalam periode tersebut
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const cutiDate = new Date(date);
      cutiDate.setHours(0, 0, 0, 0);

      await Attendance.deleteMany({
        employeeId: leaveRequest.employeeId._id,
        tanggal: {
          $gte: cutiDate,
          $lt: new Date(cutiDate.getTime() + 24 * 60 * 60 * 1000),
        },
        status: "Cuti",
      });
    }

    // Update status karyawan kembali ke Aktif jika sedang cuti
    const employee = await Employee.findById(leaveRequest.employeeId._id);
    if (employee && employee.status === "Cuti") {
      employee.status = "Aktif";
      await employee.save();
    }
  }

  const employeeName = leaveRequest.employeeId.nama;
  await leaveRequest.deleteOne();

  res.status(200).json({ 
    message: userRole === "admin" 
      ? `Pengajuan cuti ${employeeName} berhasil dihapus.${leaveRequest.status === "Disetujui" ? " Catatan absensi terkait juga telah dihapus." : ""}`
      : "Pengajuan cuti berhasil dihapus." 
  });
});
