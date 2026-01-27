# 🌱 Database Seeders

Folder ini berisi script seeder untuk mengisi database dengan data awal.

## 📋 Daftar Seeder

### 1. Admin Seeder (`adminSeeder.js`)

Seeder untuk membuat akun admin default yang dapat digunakan untuk login pertama kali.

#### 🔐 Kredensial Default

```
Email: admin@absensipekerja.com
Password: admin123
```

⚠️ **PENTING**: Segera ubah password setelah login pertama kali untuk keamanan!

## 🚀 Cara Menggunakan

### Metode 1: Menggunakan NPM Script (Recommended)

```bash
# Jalankan dari root folder backend (absensipekerja-be)
npm run seed:admin
```

### Metode 2: Menggunakan Node Langsung

```bash
# Jalankan dari root folder backend (absensipekerja-be)
node seeders/adminSeeder.js
```

## 📝 Catatan

1. **Environment Variables**: Pastikan file `.env` sudah dikonfigurasi dengan benar, terutama `MONGO_URI`
2. **Koneksi Database**: Seeder akan otomatis terhubung ke database MongoDB menggunakan `MONGO_URI`
3. **Duplikasi**: Seeder akan mengecek apakah admin dengan email yang sama sudah ada. Jika sudah ada, seeder tidak akan membuat admin baru
4. **Password Hashing**: Password akan di-hash secara otomatis oleh model Admin menggunakan bcrypt

## 🔧 Kustomisasi

Jika ingin mengubah data admin default, edit file `adminSeeder.js` pada bagian:

```javascript
const adminData = {
  nama: "Super Admin",
  email: "admin@absensipekerja.com",
  password: "admin123",
  role: "admin"
};
```

## ✅ Output Sukses

Jika seeder berhasil dijalankan, Anda akan melihat output seperti ini:

```
🔄 Menghubungkan ke MongoDB...
✅ Berhasil terhubung ke MongoDB
🔄 Membuat akun admin baru...

✅ Akun admin berhasil dibuat!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Detail Akun Admin:
   ID: 507f1f77bcf86cd799439011
   Nama: Super Admin
   Email: admin@absensipekerja.com
   Role: admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 Kredensial Login:
   Email: admin@absensipekerja.com
   Password: admin123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  PENTING: Segera ubah password setelah login pertama!

🔌 Koneksi database ditutup
```

## 🛡️ Keamanan

- Jangan commit file `.env` ke repository
- Ubah password default setelah login pertama
- Gunakan password yang kuat untuk production
- Pertimbangkan untuk menghapus atau menonaktifkan seeder di production

## 📞 Troubleshooting

### Error: "Cannot connect to MongoDB"
- Pastikan MongoDB server berjalan
- Periksa `MONGO_URI` di file `.env`
- Periksa koneksi internet jika menggunakan MongoDB Atlas

### Error: "Admin dengan email ini sudah ada"
- Admin sudah pernah dibuat sebelumnya
- Gunakan email yang berbeda atau hapus admin yang ada di database

### Error: "Module not found"
- Pastikan semua dependencies sudah terinstall: `npm install`
- Pastikan menjalankan dari folder `absensipekerja-be`
