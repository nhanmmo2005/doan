require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306), // ✅ QUAN TRỌNG
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  charset: "utf8mb4",

  // ✅ giảm lỗi treo/timeout mạng
  connectTimeout: 30000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

module.exports = pool;
