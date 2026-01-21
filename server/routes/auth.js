const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ msg: "Thiếu dữ liệu" });

  const [exist] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if (exist.length) return res.status(409).json({ msg: "Email đã tồn tại" });

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    "INSERT INTO users(name, email, password_hash, role) VALUES (?, ?, ?, 'user')",
    [name, email, passwordHash]
  );

  res.json({ ok: true, userId: result.insertId });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.query(
    "SELECT id, name, email, password_hash, role, locked FROM users WHERE email = ?",
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

  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

module.exports = router;
