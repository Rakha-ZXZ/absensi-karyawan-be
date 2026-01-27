import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    // Hanya akan ada 1 dokumen settings di database
    settingsId: {
      type: String,
      default: "app-settings",
      unique: true,
    },
    // Informasi Perusahaan
    namaPerusahaan: {
      type: String,
      default: "PT. Teknologi Nusantara",
    },
    alamatPerusahaan: {
      type: String,
      default: "Jl. Inovasi Raya No. 42, Jakarta",
    },
    // Jam Kerja
    jamMasuk: {
      type: String,
      default: "08:00",
    },
    jamPulang: {
      type: String,
      default: "17:00",
    },
    // Koordinat Lokasi Kantor untuk Absensi
    officeLatitude: {
      type: Number,
      required: [true, "Latitude kantor wajib diisi"],
      default: -6.200000, // Default Jakarta
    },
    officeLongitude: {
      type: Number,
      required: [true, "Longitude kantor wajib diisi"],
      default: 106.816666, // Default Jakarta
    },
    // Radius Maksimal untuk Absensi (dalam meter)
    maxAttendanceRadius: {
      type: Number,
      required: [true, "Radius maksimal wajib diisi"],
      default: 100, // 100 meter
      min: [10, "Radius minimal adalah 10 meter"],
      max: [5000, "Radius maksimal adalah 5000 meter"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", SettingsSchema);
