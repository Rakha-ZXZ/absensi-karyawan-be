import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    // Menghubungkan record absensi ini dengan seorang karyawan
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", // Ini harus cocok dengan nama model Employee Anda
      required: [true, "ID Karyawan wajib diisi"],
    },
    // Tanggal absensi (hanya tanggal, tanpa waktu)
    tanggal: {
      type: Date,
      required: [true, "Tanggal wajib diisi"],
    },
    // Waktu lengkap (tanggal + jam) saat karyawan check-in
    jamMasuk: {
      type: Date,
      default: null,
    },
    // Waktu lengkap (tanggal + jam) saat karyawan check-out
    jamPulang: {
      type: Date,
      default: null,
    },
    // Status kehadiran pada hari itu
    status: {
      type: String,
      enum: ["Hadir", "Terlambat", "Sakit", "Izin", "Alpha", "Cuti"],
      required: [true, "Status kehadiran wajib diisi"],
    },
    // Catatan tambahan, misalnya alasan izin atau sakit
    keterangan: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true, // Menambahkan field `createdAt` dan `updatedAt` secara otomatis
  }
);

export default mongoose.model("Attendance", attendanceSchema);