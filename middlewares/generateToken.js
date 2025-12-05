import jwt from "jsonwebtoken";

const generateToken = (res, userId, userRole) => {
  const token = jwt.sign(
    { id: userId, role: userRole}, 
    process.env.JWT_SECRET, 
    {expiresIn: "1d",}
);

  // Simpan token di HTTP-Only cookie
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development", // true di production
    sameSite: "strict", // Mencegah serangan CSRF
  });
};

export default generateToken;