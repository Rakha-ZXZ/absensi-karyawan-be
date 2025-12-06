import jwt from "jsonwebtoken";

const generateToken = (res, userId, userRole) => {
  const token = jwt.sign(
    { id: userId, role: userRole}, 
    process.env.JWT_SECRET, 
    {expiresIn: "1d",}
);

const isProduction = process.env.NODE_ENV !== "development";

  // 1. Tambahkan logging untuk melihat detail cookie di log Vercel
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax", 
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // Log juga waktu kedaluwarsa
  };
  
  console.log(`[AUTH-LOG] Token JWT dibuat untuk User ID: ${userId}, Role: ${userRole}`);
  console.log(`[AUTH-LOG] Cookie 'jwt' diatur. Secure: ${cookieOptions.secure}, SameSite: ${cookieOptions.sameSite}`);
  

  // Simpan token di HTTP-Only cookie
  res.cookie("jwt", token, cookieOptions);


  
  return token; // Kembalikan token agar bisa disertakan di respons
};

export const sendTokenResponse = (req, res) => {
  // Asumsi: Data user dilampirkan ke req.user oleh middleware login
  const user = req.user;

  if (!user) {
    return res.status(500).json({ 
      success: false,
      message: "Terjadi kesalahan, data pengguna tidak ditemukan setelah login." 
    });
  }

  // Panggil fungsi generateToken dan ambil token yang dibuat
  const token = generateToken(res, user._id, user.role);

  console.log(`[AUTH-LOG] Mengirim respons sukses untuk user ${user.email}.`);
  
  // Kirim respons sukses (status 200) dengan status, token, dan data user
  res.status(200).json({ 
    success: true, // Status sukses
    message: "Login berhasil.",
    token: token, // Tampilkan token di response body (untuk debugging/front-end jika perlu)
    user: {
      _id: user._id, 
      nama: user.nama, 
      email: user.email, 
      role: user.role 
    }
  });
  
};


export default generateToken;