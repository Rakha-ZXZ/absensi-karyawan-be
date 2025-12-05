import mongoose from "mongoose";
// Asumsi pustaka 'bcrypt' sudah terinstal
import bcrypt from "bcrypt"; 

const AdminSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: [true, "Nama wajib diisi"],
    },
    email: {
      type: String,
      required: [true, "Email wajib diisi"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password wajib diisi"],
    },
    role: {
      type: String,
      default: "admin",
    },
  },
  { timestamps: true }
);


AdminSchema.pre("save", async function () {
  // Hanya lakukan hashing jika field password DIMODIFIKASI
   if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
});

AdminSchema.methods.comparePassword = async function (enteredPassword) {
    // Gunakan bcrypt.compare() untuk membandingkan password yang belum dihash
    // (enteredPassword) dengan password yang sudah dihash (this.password) di database.
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Admin", AdminSchema);