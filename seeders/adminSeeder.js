import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";

// Load environment variables
dotenv.config();

/**
 * Seeder untuk membuat akun admin default
 * Jalankan dengan: node seeders/adminSeeder.js
 */

const adminData = {
  nama: "Super Admin",
  email: "admin@absensipekerja.com",
  password: "admin123", // Password akan di-hash otomatis oleh pre-save hook di model
  role: "admin"
};

const seedAdmin = async () => {
  try {
    // Koneksi ke MongoDB
    console.log("🔄 Menghubungkan ke MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Berhasil terhubung ke MongoDB");

    // Cek apakah admin dengan email tersebut sudah ada
    const existingAdmin = await Admin.findOne({ email: adminData.email });

    if (existingAdmin) {
      console.log("⚠️  Admin dengan email ini sudah ada:");
      console.log(`   Nama: ${existingAdmin.nama}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log("\n💡 Jika ingin membuat admin baru, gunakan email yang berbeda.");
    } else {
      // Buat admin baru
      console.log("🔄 Membuat akun admin baru...");
      const newAdmin = await Admin.create(adminData);
      
      console.log("\n✅ Akun admin berhasil dibuat!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📋 Detail Akun Admin:");
      console.log(`   ID: ${newAdmin._id}`);
      console.log(`   Nama: ${newAdmin.nama}`);
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Role: ${newAdmin.role}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\n🔐 Kredensial Login:");
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Password: ${adminData.password}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\n⚠️  PENTING: Segera ubah password setelah login pertama!");
    }

  } catch (error) {
    console.error("\n❌ Error saat menjalankan seeder:");
    console.error(error.message);
    process.exit(1);
  } finally {
    // Tutup koneksi database
    await mongoose.connection.close();
    console.log("\n🔌 Koneksi database ditutup");
    process.exit(0);
  }
};

// Jalankan seeder
seedAdmin();
