import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
    
    // ⚠️ REVISI PENTING: Lewati middleware otentikasi untuk preflight request OPTIONS
    // Permintaan OPTIONS tidak membawa cookie otentikasi dan harus diizinkan oleh CORS
    if (req.method === 'OPTIONS') {
        // Lanjutkan ke handler/middleware berikutnya (biasanya CORS)
        // Tanpa memproses otentikasi
        return next();
    }

    // Ambil token dari cookie
    const token = req.cookies.jwt; 

    // Jika tidak ada token (401 karena browser tidak mengirimkan cookie)
    if (!token) {
        // Log ini akan muncul jika browser GAGAL mengirimkan cookie (biasanya karena masalah CORS/SameSite yang belum tuntas)
        console.log("[AUTH ERROR] Akses ditolak: Tidak ada cookie 'jwt' ditemukan.");
        return res.status(401).json({ message: "Akses ditolak. Tidak ada token otentikasi." });
    }

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Lampirkan data user ke objek request (req)
        req.user = { 
            id: decoded.id, 
            role: decoded.role 
        };

        // Lanjutkan ke handler route berikutnya
        next();
    } catch (err) {
        // Logika untuk token yang tidak valid (expired, signature salah)
        console.error("[AUTH ERROR] Token JWT tidak valid:", err.message);
        // Hapus cookie yang tidak valid/kedaluwarsa (Opsional: Praktik yang baik)
        res.clearCookie('jwt'); 
        
        return res.status(401).json({ message: "Token tidak valid atau kedaluwarsa." });
    }
};

export default verifyToken;