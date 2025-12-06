import Employee from "../models/Employee.js";
import asyncHandler from 'express-async-handler';
import generateToken from "../middlewares/generateToken.js";
import mongoose from 'mongoose';

/**
 * @desc    Get employee profile
 * @route   GET /api/karyawan/profile
 * @access  Private (Karyawan)
 */
export const getEmployeeProfile = async (req, res) => {
  try {
    // Pastikan role adalah 'karyawan'
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: "Akses ditolak. Hanya untuk karyawan." });
    }

    // Ambil ID dari req.user yang dilampirkan oleh middleware verifyToken
    const employeeId = req.user.id;

    // Cari karyawan di database berdasarkan ID, tanpa menyertakan password
    const employee = await Employee.findById(employeeId).select('-password');

    if (employee) {
      res.status(200).json(employee);
    } else {
      res.status(404).json({ message: "Karyawan tidak ditemukan" });
    }
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

/**
 * @desc    Mengubah password karyawan
 * @route   PUT /api/karyawan/change-password
 * @access  Private (Employee)
 */
export const changePasswordEmployee = async (req, res) => {
  try {
    // 1. Pastikan role adalah 'employee'
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: "Akses ditolak. Hanya untuk karyawan." });
    }

    const employeeId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // 2. Validasi input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Kata sandi saat ini dan kata sandi baru wajib diisi." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Kata sandi baru minimal harus 6 karakter." });
    }

    // 3. Cari karyawan berdasarkan ID
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Karyawan tidak ditemukan." });
    }

    // 4. Verifikasi kata sandi saat ini
    const isMatch = await employee.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: "Kata sandi saat ini salah." });
    }

    // 5. Update kata sandi baru (akan di-hash oleh middleware pre-save di model Employee)
    employee.password = newPassword;
    await employee.save();

    res.status(200).json({ message: "Kata sandi berhasil diubah." });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};


/**
 * @desc    Get all employees
 * @route   GET /api/karyawan
 * @access  Private (Admin)
 */
export const getAllEmployees = asyncHandler(async (req, res) => {
  // Pastikan yang mengakses adalah admin
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error("Akses ditolak. Hanya admin yang dapat melihat semua karyawan.");
  }

  // Ambil semua karyawan, jangan sertakan password, urutkan dari yang terbaru
  const employees = await Employee.find({}).select('-password').sort({ createdAt: -1 });
  res.status(200).json(employees);
});

export const createEmployee = asyncHandler(async (req, res) => {
  // Pastikan yang mengakses adalah admin
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error("Akses ditolak. Hanya admin yang dapat menambah karyawan.");
  }

  const {
    nama,
    email,
    password,
    jabatan,
    departemen,
    nomorTelepon,
    alamat,
    status
  } = req.body;

  // Validasi field wajib
  if (!nama || !password) {
    res.status(400);
    throw new Error("Nama dan password wajib diisi.");
  }

  // Cek jika email sudah ada (jika email diisi)
  if (email) {
    const employeeExists = await Employee.findOne({ email });
    if (employeeExists) {
      res.status(400);
      throw new Error("Karyawan dengan email tersebut sudah terdaftar.");
    }
  }

  // Buat karyawan baru (employerId dan password hash ditangani oleh model)
  const employee = await Employee.create(req.body);

  res.status(201).json({ message: "Karyawan berhasil ditambahkan", data: employee });
});

/**
 * @desc    Memperbarui data karyawan
 * @route   PUT /api/admin/update-employee/:id
 * @access  Private/Admin
 */
export const updateEmployee = asyncHandler(async (req, res) => {
  // Pastikan yang mengakses adalah admin
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error("Akses ditolak. Hanya admin yang dapat memperbarui data karyawan.");
  }

  const { id } = req.params;

  // Validasi ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('ID karyawan tidak valid.');
  }

  const employee = await Employee.findById(id);

  if (!employee) {
    res.status(404);
    throw new Error('Karyawan tidak ditemukan.');
  }

  const { email, password } = req.body;

  // Cek jika email diubah dan sudah ada yang menggunakan
  if (email && email !== employee.email) {
    const employeeExists = await Employee.findOne({ email });
    if (employeeExists) {
      res.status(400);
      throw new Error("Karyawan dengan email tersebut sudah terdaftar.");
    }
  }

  // Update field yang ada di body
  Object.keys(req.body).forEach(key => {
    // Jangan update password jika kosong
    if (key === 'password' && !req.body.password) return;
    employee[key] = req.body[key];
  });

  const updatedEmployee = await employee.save();

  res.status(200).json({ message: 'Data karyawan berhasil diperbarui.', data: updatedEmployee });
});

/**
 * @desc    Menghapus data karyawan
 * @route   DELETE /api/admin/delete-employee/:id
 * @access  Private/Admin
 */
export const deleteEmployee = asyncHandler(async (req, res) => {
  // Pastikan yang mengakses adalah admin
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error("Akses ditolak. Hanya admin yang dapat menghapus karyawan.");
  }

  const { id } = req.params;

  // Validasi apakah ID yang diberikan adalah format ObjectId yang valid
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('ID karyawan tidak valid.');
  }

  // Cari dan hapus karyawan berdasarkan ID
  const employee = await Employee.findByIdAndDelete(id);

  // Jika tidak ada karyawan yang ditemukan dengan ID tersebut
  if (!employee) {
    res.status(404);
    throw new Error('Karyawan tidak ditemukan.');
  }

  res.status(200).json({ message: 'Data karyawan berhasil dihapus.' });
});

export const loginEmployee = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    res.status(400);
    throw new Error("Harap isi email dan password");
  }

  const employee = await Employee.findOne({ email });

  if (employee && (await employee.comparePassword(password))) {
    // Lampirkan data employee ke request untuk digunakan middleware selanjutnya
    req.user = employee; 
    next(); // Lanjutkan ke middleware pembuatan token
  } else {      
    res.status(401);
    throw new Error("Email atau password salah");
  }
});