# 🌱 Panduan Seeder Admin - Sistem Absensi Pekerja

Panduan lengkap untuk membuat akun admin menggunakan seeder.

## 📌 Ringkasan

Seeder ini akan membuat akun admin default yang dapat digunakan untuk login pertama kali ke sistem.

### 🔐 Kredensial Admin Default

```
Email    : admin@absensipekerja.com
Password : admin123
Role     : admin
```

## 🚀 Cara Menjalankan Seeder

### Langkah 1: Pastikan Environment Variables Sudah Dikonfigurasi

Pastikan file `.env` di folder `absensipekerja-be` sudah berisi:

```env
MONGO_URI=mongodb://localhost:27017/absensipekerja
# atau jika menggunakan MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/absensipekerja
```

### Langkah 2: Jalankan Seeder

**Opsi A - Menggunakan NPM Script (Recommended):**

```bash
cd absensipekerja-be
npm run seed:admin
```

**Opsi B - Menggunakan Node Langsung:**

```bash
cd absensipekerja-be
node seeders/adminSeeder.js
```

### Langkah 3: Verifikasi Output

Jika berhasil, Anda akan melihat output seperti ini:

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

## 🔄 Menjalankan Ulang Seeder

Jika admin sudah pernah dibuat, seeder akan menampilkan pesan:

```
⚠️  Admin dengan email ini sudah ada:
   Nama: Super Admin
   Email: admin@absensipekerja.com
   Role: admin

💡 Jika ingin membuat admin baru, gunakan email yang berbeda.
```

Untuk membuat admin baru dengan email berbeda, edit file `seeders/adminSeeder.js`.

## 🔧 Kustomisasi Data Admin

Jika ingin mengubah data admin default, edit file `absensipekerja-be/seeders/adminSeeder.js`:

```javascript
const adminData = {
  nama: "Super Admin",              // Ubah nama admin
  email: "admin@absensipekerja.com", // Ubah email admin
  password: "admin123",              // Ubah password admin
  role: "admin"                      // Role tetap "admin"
};
```

## 📝 Langkah Setelah Seeder Berhasil

1. **Login ke Sistem**
   - Buka aplikasi frontend
   - Masuk ke halaman login admin
   - Gunakan kredensial yang telah dibuat

2. **Ubah Password**
   - Setelah login, segera ubah password default
   - Gunakan fitur "Ubah Password" di menu Pengaturan
   - Gunakan password yang kuat dan aman

3. **Mulai Menggunakan Sistem**
   - Kelola karyawan
   - Monitor absensi
   - Kelola payroll
   - Dan fitur lainnya

## ⚠️ Catatan Penting

### Keamanan
- ✅ Password akan di-hash otomatis menggunakan bcrypt
- ✅ Seeder mengecek duplikasi email
- ⚠️ Ubah password default setelah login pertama
- ⚠️ Jangan commit file `.env` ke repository
- ⚠️ Gunakan password yang kuat untuk production

### Database
- Seeder akan otomatis terhubung ke MongoDB menggunakan `MONGO_URI`
- Koneksi akan ditutup otomatis setelah seeder selesai
- Tidak akan membuat duplikat jika admin dengan email yang sama sudah ada

## 🛠️ Troubleshooting

### Problem: "Cannot connect to MongoDB"

**Solusi:**
- Pastikan MongoDB server berjalan
- Periksa `MONGO_URI` di file `.env`
- Jika menggunakan MongoDB Atlas, periksa koneksi internet
- Pastikan IP address sudah ditambahkan ke whitelist (untuk MongoDB Atlas)

### Problem: "Admin dengan email ini sudah ada"

**Solusi:**
- Admin sudah pernah dibuat sebelumnya
- Gunakan kredensial yang ada untuk login
- Atau edit `adminSeeder.js` untuk menggunakan email yang berbeda

### Problem: "Module not found"

**Solusi:**
```bash
cd absensipekerja-be
npm install
```

### Problem: "Cannot find module '../models/Admin.js'"

**Solusi:**
- Pastikan menjalankan seeder dari folder `absensipekerja-be`
- Pastikan struktur folder sudah benar

## 📂 Struktur File Seeder

```
absensipekerja-be/
├── seeders/
│   ├── adminSeeder.js    # Script seeder utama
│   └── README.md         # Dokumentasi detail seeder
├── models/
│   └── Admin.js          # Model Admin
├── package.json          # NPM scripts
├── .env                  # Environment variables
└── SEEDER_GUIDE.md       # Panduan ini
```

## 📞 Bantuan Lebih Lanjut

Untuk informasi lebih detail, lihat:
- `seeders/README.md` - Dokumentasi teknis seeder
- `models/Admin.js` - Schema model Admin
- `controllers/adminController.js` - Controller admin

---

**Dibuat untuk Sistem Absensi Pekerja**
