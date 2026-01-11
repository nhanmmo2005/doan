console.log("RUNNING FILE:", __filename);
console.log("CWD:", process.cwd());
require("dotenv").config();
console.log("ENV CHECK:", {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  HAS_DB_PASSWORD: !!process.env.DB_PASSWORD,
});
const express = require("express");
const cors = require("cors");
require("dotenv").config();
console.log("ENV CHECK:", {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  HAS_DB_PASSWORD: !!process.env.DB_PASSWORD
});


const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => res.json({ ok: true, msg: "Foodbook API running" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/restaurants", require("./routes/restaurants"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/comments", require("./routes/comments"));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
