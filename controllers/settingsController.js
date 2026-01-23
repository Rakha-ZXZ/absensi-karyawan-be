import asyncHandler from "express-async-handler";
import Settings from "../models/Settings.js";

/**
 * @desc    Mengambil pengaturan aplikasi
 * @route   GET /api/settings
 * @access  Private (Admin)
 */
export const getSettings = asyncHandler(async (req, res) => {
  // Cari settings, jika tidak ada buat default
  let settings = await Settings.findOne({ settingsId: "app-settings" });

  if (!settings) {
    // Buat settings default jika belum ada
    settings = await Settings.create({
      settingsId: "app-settings",
    });
  }

  res.status(200).json(settings);
});

/**
 * @desc    Memperbarui pengaturan aplikasi
 * @route   PUT /api/settings
 * @access  Private (Admin)
 */
export const updateSettings = asyncHandler(async (req, res) => {
  // Pastikan yang mengakses adalah admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("Akses ditolak. Hanya untuk admin.");
  }

  const {
    namaPerusahaan,
    alamatPerusahaan,
    jamMasuk,
    jamPulang,
    officeLatitude,
    officeLongitude,
    maxAttendanceRadius,
  } = req.body;

  // Validasi koordinat
  if (officeLatitude !== undefined) {
    if (officeLatitude < -90 || officeLatitude > 90) {
      res.status(400);
      throw new Error("Latitude harus antara -90 dan 90");
    }
  }

  if (officeLongitude !== undefined) {
    if (officeLongitude < -180 || officeLongitude > 180) {
      res.status(400);
      throw new Error("Longitude harus antara -180 dan 180");
    }
  }

  // Validasi radius
  if (maxAttendanceRadius !== undefined) {
    if (maxAttendanceRadius < 10 || maxAttendanceRadius > 5000) {
      res.status(400);
      throw new Error("Radius harus antara 10 dan 5000 meter");
    }
  }

  // Cari settings yang ada
  let settings = await Settings.findOne({ settingsId: "app-settings" });

  if (!settings) {
    // Jika belum ada, buat baru
    settings = await Settings.create({
      settingsId: "app-settings",
      namaPerusahaan,
      alamatPerusahaan,
      jamMasuk,
      jamPulang,
      officeLatitude,
      officeLongitude,
      maxAttendanceRadius,
    });
  } else {
    // Update settings yang ada
    if (namaPerusahaan !== undefined) settings.namaPerusahaan = namaPerusahaan;
    if (alamatPerusahaan !== undefined) settings.alamatPerusahaan = alamatPerusahaan;
    if (jamMasuk !== undefined) settings.jamMasuk = jamMasuk;
    if (jamPulang !== undefined) settings.jamPulang = jamPulang;
    if (officeLatitude !== undefined) settings.officeLatitude = officeLatitude;
    if (officeLongitude !== undefined) settings.officeLongitude = officeLongitude;
    if (maxAttendanceRadius !== undefined) settings.maxAttendanceRadius = maxAttendanceRadius;

    await settings.save();
  }

  res.status(200).json({
    message: "Pengaturan berhasil diperbarui",
    data: settings,
  });
});
