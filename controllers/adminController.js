import Admin from "../models/Admin.js";
import generateToken from "../middlewares/generateToken.js";

// controllers/authController.js (misalnya)

// Asumsi Anda telah mengimpor Admin.js


/**
 * @desc    Register a new admin
 * @route   POST /api/admins/register
 * @access  Public (biasanya pendaftaran pertama kali oleh superadmin/developer, bisa diubah sesuai kebutuhan)
 */
export const registerAdmin = async (req, res) => {
  const { nama, email, password } = req.body;

  // Validasi dasar, pastikan semua field diisi
  if (!nama || !email || !password) {
    return res.status(400).json({ message: "Harap isi semua field" });
  }

  try {
    // 1. Cek apakah email sudah terdaftar
    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
      return res.status(400).json({ message: "Admin dengan email ini sudah ada" });
    }

    // 2. Buat admin baru
    // Password akan di-hash secara otomatis oleh middleware pre-save di model Admin
    const admin = await Admin.create({
      nama,
      email,
      password,
    });

    // 3. Kirim respons sukses
    if (admin) {
      res.status(201).json({
        _id: admin._id,
        nama: admin.nama,
        email: admin.email,
        role: admin.role,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

/**
 * @desc    Mengubah password admin
 * @route   PUT /api/admin/change-password
 * @access  Private (Admin)
 */
export const changePasswordAdmin = async (req, res) => {
  try {
    // 1. Pastikan role adalah 'admin'
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Akses ditolak. Hanya untuk admin." });
    }

    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // 2. Validasi input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Kata sandi saat ini dan kata sandi baru wajib diisi." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Kata sandi baru minimal harus 6 karakter." });
    }

    // 3. Cari admin berdasarkan ID
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin tidak ditemukan." });
    }

    // 4. Verifikasi kata sandi saat ini
    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: "Kata sandi saat ini salah." });
    }

    // 5. Update kata sandi baru (akan di-hash oleh middleware pre-save di model Admin)
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({ message: "Kata sandi berhasil diubah." });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};
/**
 * @desc    Auth admin & get token (Login)
 * @route   POST /api/admins/login
 * @access  Public
 */
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  // Validasi dasar
  if (!email || !password) {
    return res.status(400).json({ message: "Harap isi email dan password" });
  }

  try {
    // 1. Cari admin berdasarkan email
    const admin = await Admin.findOne({ email });

    // 2. Cek apakah admin ada DAN password-nya cocok (menggunakan method dari model)
    if (admin && (await admin.comparePassword(password))) {
      generateToken(res, admin._id, admin.role); // Buat token dan simpan di cookie

      res.status(200).json({
        _id: admin._id,
        nama: admin.nama,
        email: admin.email,
      });
    } else {
      // Beri pesan yang sama untuk email/password salah demi keamanan
      res.status(401).json({ message: "Email atau password salah" });
    }
  } 
  catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

/**
 * @desc    Get admin profile
 * @route   GET /api/auth/admin/profile
 * @access  Private
 */
export const getAdminProfile = async (req, res) => {
  try {
    // Verifikasi bahwa peran pengguna adalah 'admin'
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Akses ditolak. Hanya untuk admin." });
    }

    // Ambil ID dari req.user yang sudah dilampirkan oleh middleware verifyToken
    const adminId = req.user.id;

    // Cari admin di database berdasarkan ID dan hanya ambil field 'nama' dan 'role'
    const admin = await Admin.findById(adminId).select('nama role');

    if (admin) {
      res.status(200).json(admin);
    } else {
      res.status(404).json({ message: "Admin tidak ditemukan" });
    }
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};
