const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const pool = require("../db");

const router = express.Router();

// Cấu hình transporter cho nodemailer (Gmail SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // true cho 465, false cho các cổng khác
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helper: Gửi OTP qua email
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"DNFoodie" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Mã xác thực đăng ký tài khoản DNFoodie",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #ff4d4f; text-align: center;">Xác thực Email của bạn</h2>
        <p>Chào bạn,</p>
        <p>Bạn đang thực hiện đăng ký tài khoản trên <strong>DNFoodie</strong>. Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình xác thực:</p>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">Mã này có hiệu lực trong vòng ${process.env.EMAIL_OTP_EXPIRE_MINUTES || 10} phút. Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; color: #999; font-size: 12px;">© 2026 DNFoodie Team</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

// 1. API: Gửi mã OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Vui lòng nhập email" });

    // Kiểm tra email đã tồn tại chưa
    const [exist] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (exist.length) return res.status(409).json({ msg: "Email đã được sử dụng" });

    // Tạo mã OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + (Number(process.env.EMAIL_OTP_EXPIRE_MINUTES) || 10) * 60000);

    // Lưu OTP vào DB (xóa mã cũ của email này nếu có)
    await pool.query("DELETE FROM email_otps WHERE email = ?", [email]);
    await pool.query(
      "INSERT INTO email_otps (email, otp_hash, expires_at) VALUES (?, ?, ?)",
      [email, otpHash, expiresAt]
    );

    // Gửi mail thực tế
    await sendOTPEmail(email, otp);

    res.json({ ok: true, msg: "Mã OTP đã được gửi đến email của bạn" });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    res.status(500).json({ msg: "Lỗi hệ thống khi gửi email" });
  }
});

// 2. API: Xác thực OTP và trả về verifyToken
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ msg: "Thiếu dữ liệu xác thực" });

    const [rows] = await pool.query(
      "SELECT otp_hash, expires_at FROM email_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1",
      [email]
    );

    if (!rows.length) return res.status(400).json({ msg: "Mã xác thực không tồn tại hoặc đã hết hạn" });

    const { otp_hash, expires_at } = rows[0];

    // Kiểm tra hết hạn
    if (new Date() > new Date(expires_at)) {
      return res.status(400).json({ msg: "Mã xác thực đã hết hạn" });
    }

    // So khớp OTP
    const isMatch = await bcrypt.compare(otp, otp_hash);
    if (!isMatch) return res.status(400).json({ msg: "Mã xác thực không đúng" });

    // Xóa OTP sau khi dùng thành công
    await pool.query("DELETE FROM email_otps WHERE email = ?", [email]);

    // Tạo token xác thực email ngắn hạn (Option A)
    const verifyToken = jwt.sign(
      { email, verified: true },
      process.env.EMAIL_VERIFY_JWT_SECRET,
      { expiresIn: process.env.EMAIL_VERIFY_JWT_EXPIRES || "15m" }
    );

    res.json({ ok: true, verifyToken });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    res.status(500).json({ msg: "Lỗi hệ thống khi xác thực" });
  }
});

// 3. API: Register (Yêu cầu verifyToken)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, verifyToken } = req.body;
    if (!name || !email || !password || !verifyToken) {
      return res.status(400).json({ msg: "Thiếu thông tin đăng ký hoặc xác thực" });
    }

    // Xác thực verifyToken
    let decoded;
    try {
      decoded = jwt.verify(verifyToken, process.env.EMAIL_VERIFY_JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ msg: "Phiên xác thực email đã hết hạn hoặc không hợp lệ" });
    }

    // Đảm bảo email trong token khớp với email gửi lên
    if (decoded.email !== email) {
      return res.status(400).json({ msg: "Email không khớp với mã xác thực" });
    }

    const [exist] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (exist.length) return res.status(409).json({ msg: "Email đã tồn tại" });

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users(name, email, password_hash, role) VALUES (?, ?, ?, 'user')",
      [name, email, passwordHash]
    );

    res.json({ ok: true, userId: result.insertId });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ msg: "Lỗi hệ thống khi đăng ký" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.query(
    "SELECT id, name, email, password_hash, role, locked, avatar_url FROM users WHERE email = ?",
    [email]
  );

  if (!rows.length) return res.status(401).json({ msg: "Sai tài khoản/mật khẩu" });
  const user = rows[0];
  if (user.locked) return res.status(403).json({ msg: "Tài khoản bị khóa" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ msg: "Sai tài khoản/mật khẩu" });

  const token = jwt.sign(
    { uid: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      avatar_url: user.avatar_url || null,
    },
  });
});

module.exports = router;
