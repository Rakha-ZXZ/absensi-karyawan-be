import mongoose from "mongoose";

const PayrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    bulan: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    tahun: {
      type: Number,
      required: true,
    },
    // Komponen Pendapatan
    gajiPokok: { type: Number, required: true, default: 0 },
    tunjanganJabatan: { type: Number, default: 0 },
    tunjanganTransport: { type: Number, default: 0 },
    tunjanganMakan: { type: Number, default: 0 },
    totalTunjangan: { type: Number, default: 0 },
    pendapatanKotor: { type: Number, default: 0 },

    // Komponen Potongan
    potonganAbsensi: { type: Number, default: 0 }, // Untuk hari Alpha/Tanpa Keterangan    
    potonganLain: { type: Number, default: 0 }, // Untuk BPJS, PPh21, dll.
    totalPotongan: { type: Number, default: 0 },

    // Hasil Akhir
    gajiBersih: {
      type: Number,
      required: true,
      default: 0,
    },

    // Detail Perhitungan (untuk transparansi)
    detailPerhitungan: {
      totalHariHadir: { type: Number, default: 0 },      
      totalHariCuti: { type: Number, default: 0 },     
      totalHariAlpha: { type: Number, default: 0 },
    },

    // Status Pembayaran
    statusPembayaran: {
      type: String,
      enum: ["Belum Dibayar", "Diproses", "Dibayar"],
      default: "Belum Dibayar",
    },
    tanggalPembayaran: {
      type: Date,
    },
    catatan: {
      type: String,
      trim: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true, // Menambahkan createdAt (generatedAt) dan updatedAt
  }
);

// Membuat index untuk memastikan setiap karyawan hanya punya satu rekap gaji per bulan
PayrollSchema.index({ employeeId: 1, bulan: 1, tahun: 1 }, { unique: true });

export default mongoose.model("Payroll", PayrollSchema);