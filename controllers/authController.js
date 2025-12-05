/**
 * @desc    Cek status login admin & kirim data profil
 * @route   GET /api/auth/check-status
 * @access  Private (memerlukan token)
 */
export const checkAuthStatus = async (req, res) => {

  try { 
    res.status(200).json({
      isAuthenticated: true,
      id: req.user.id,
      role: req.user.role,      
    });
    

  } catch (error) {
    res.status(500).json({ message: "Kesalahan server saat mengambil data profil." });
  }
};

/**
 * @desc    Logout admin / clear cookie
 * @route   POST /api/auth/admin/logout
 * @access  Private
 */
export const logout = (req, res) => {
  // Verifikasi bahwa peran pengguna adalah 'admin'
  if (!(req.user.role === 'admin'||'employee')) {
    return res.status(403).json({ message: "Akses ditolak." });
  }

  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0), // Set cookie kedaluwarsa
  });
  res.status(200).json({ message: "Logout berhasil" });
};

