import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

// Untuk mendapatkan __dirname di ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Konfigurasi storage untuk multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Tentukan folder berdasarkan route
    let folder = "uploads/attendance";
    if (req.path.includes("/leave-requests") || req.baseUrl.includes("/leave-requests")) {
      folder = "uploads/leave-requests";
    }
    
    const uploadPath = path.join(__dirname, "..", folder);
    
    // Buat folder jika belum ada
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate nama file unik: employeeId_timestamp_originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const employeeId = req.user?.id || "unknown";
    cb(null, `${employeeId}_${uniqueSuffix}${ext}`);
  },
});

// Filter untuk hanya menerima file gambar
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Hanya file gambar (JPEG, JPG, PNG, GIF, WEBP) yang diperbolehkan!"));
  }
};

// Konfigurasi multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimal 5MB
  },
  fileFilter: fileFilter,
});

export default upload;
