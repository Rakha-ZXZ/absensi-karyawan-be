import jwt from "jsonwebtoken";

const generateToken = (res, userId, userRole) => {
  const token = jwt.sign(
    { id: userId, role: userRole}, 
    process.env.JWT_SECRET, 
    {expiresIn: "1d",}
);

  // Simpan token di HTTP-Only cookie
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development", // true di production
    sameSite: "strict", // Mencegah serangan CSRF
  });
};

export const sendTokenResponse = (req, res) => {
  // Ambil data user yang sudah dilampirkan oleh middleware login
  const user = req.user;

  if (!user) {
    return res.status(500).json({ message: "Terjadi kesalahan, data pengguna tidak ditemukan setelah login." });
  }

  // Panggil fungsi generateToken yang sudah ada
  generateToken(res, user._id, user.role);

  // Kirim respons sukses
  res.status(200).json({ _id: user._id, nama: user.nama, email: user.email, role: user.role });
};


export default generateToken;