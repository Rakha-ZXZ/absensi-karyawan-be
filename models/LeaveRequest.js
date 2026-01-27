import mongoose from "mongoose";

const LeaveRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee ID wajib diisi"],
    },
    tanggalMulai: {
      type: Date,
      required: [true, "Tanggal mulai cuti wajib diisi"],
    },
    tanggalSelesai: {
      type: Date,
      required: [true, "Tanggal selesai cuti wajib diisi"],
    },
    jumlahHari: {
      type: Number,
      required: true,
    },
    alasan: {
      type: String,
      required: [true, "Alasan cuti wajib diisi"],
    },
    fotoSurat: {
      type: String, // Path ke file foto surat keterangan (opsional)
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "Disetujui", "Ditolak"],
      default: "Pending",
    },
    keteranganAdmin: {
      type: String, // Keterangan dari admin saat approve/reject
      default: null,
    },
    disetujuiOleh: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    tanggalDisetujui: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("LeaveRequest", LeaveRequestSchema);
