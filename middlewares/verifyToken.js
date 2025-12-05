import jwt from 'jsonwebtoken';


const verifyToken = (req, res, next) => {

  const token = req.cookies.jwt; 

  if (!token) {
    return res.status(401).json({ message: "Akses ditolak. Tidak ada token otentikasi." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Lampirkan data user ke objek request (req)
    req.user = { 
      id: decoded.id, 
      role: decoded.role 
    };

    // Lanjutkan ke handler route berikutnya
    next();
  } catch (err) {
    // Jika token tidak valid (expired, signature salah, dll.)
    // 401 Unauthorized: Kredensial tidak valid
    return res.status(401).json({ message: "Token tidak valid atau kedaluwarsa." });
  }
};

export default verifyToken;