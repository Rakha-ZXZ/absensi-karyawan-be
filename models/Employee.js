import mongoose from "mongoose";
import bcrypt from "bcrypt";

const JABATAN_ENUM = [
  "Software Developer",
  "Project Manager",
  "UI/UX Designer",
  "QA Engineer",
  "HR Staff",
  "Marketing Specialist",
];

const DEPARTEMEN_ENUM = [
  "Teknologi Informasi",
  "Human Resources",
  "Marketing",
  "Finance",
  "Operations",
];


const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
    },
    nama: {
      type: String,
      required: [true, "Nama wajib diisi"],
    },
    jabatan: {
      type: String,
      // Tambahkan " " agar bisa divalidasi, nilai akan diatur di pre-validate hook
      enum: [...JABATAN_ENUM, " "],
    },
    departemen: {
      type: String,
      enum: [...DEPARTEMEN_ENUM, " "],
    },
    nomorTelepon: {
      type: String,
    },
    alamat: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      // Validasi match hanya berjalan jika field tidak kosong
      // sparse: true akan mengizinkan nilai null/kosong untuk field yang unik
      sparse: true, 
      match: [/.+\@.+\..+/, "Harap masukkan email yang valid"],
    },
    password: {
      type: String,
      required: [true, "Password wajib diisi"],
      minlength: [6, "Password minimal 6 karakter"],
    },
    // Field untuk penggajian
    gajiPokok: {
      type: Number,
      required: [true, "Gaji pokok wajib diisi"],
      default: 0,
      min: [0, "Gaji pokok tidak boleh negatif"],
    },
    tunjanganJabatan: {
      type: Number,
      default: 0,
      min: [0, "Tunjangan tidak boleh negatif"],
    },
    tunjanganTransport: {
      type: Number,
      default: 0,
      min: [0, "Tunjangan tidak boleh negatif"],
    },
    tunjanganMakan: {
      type: Number,
      default: 0,
      min: [0, "Tunjangan tidak boleh negatif"],
    },
    tanggalMasuk: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Aktif", "Cuti"],
      default: "Aktif",
    },
    role: {
      type: String,
      default: "employee",
    },
  },
  { timestamps: true }
);

// Middleware untuk memeriksa nilai enum sebelum validasi
EmployeeSchema.pre("validate", function() {
  // Jika jabatan didefinisikan (termasuk string kosong) dan tidak ada dalam ENUM, set ke " "
  if (this.jabatan !== undefined && !JABATAN_ENUM.includes(this.jabatan)) {
    this.jabatan = " ";
  }
  // Jika departemen didefinisikan (termasuk string kosong) dan tidak ada dalam ENUM, set ke " "
  if (this.departemen !== undefined && !DEPARTEMEN_ENUM.includes(this.departemen)) {
    this.departemen = " ";
  } 
});

// Middleware untuk hash password sebelum menyimpan
EmployeeSchema.pre("save", async function () { // Hapus 'next' dari parameter
  // Hanya jalankan jika dokumen ini baru (pertama kali dibuat)
  if (this.isNew) {
    let isUnique = false;
    let generatedId;
    // Loop untuk memastikan ID yang dibuat benar-benar unik
    while (!isUnique) {
      // Buat ID acak dengan format EMP-XXXXXX
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      generatedId = `EMP-${randomNum}`;
      // Cek apakah ID sudah ada di database
      const existingEmployee = await this.constructor.findOne({ employeeId: generatedId });
      if (!existingEmployee) {
        isUnique = true;
      }
    }
    this.employeeId = generatedId;
  }

  // Hash password jika field password dimodifikasi (atau baru)
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
});

// Method untuk membandingkan password saat login
EmployeeSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Employee", EmployeeSchema);