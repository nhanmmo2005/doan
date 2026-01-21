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

// CORS configuration: allow credentials and only allow known origins in production.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin like mobile apps or curl
    if (!origin) return callback(null, true);
    // during development allow localhost origins
    if (process.env.NODE_ENV !== "production") return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, false);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => res.json({ ok: true, msg: "Foodbook API running" }));

app.use("/api/auth", require("./routes/auth"));
// Also accept legacy /auth routes so dev frontends calling /auth/* still work
app.use("/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/restaurants", require("./routes/restaurants"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/eating-plans", require("./routes/eatingPlans"));
app.use("/api/eating-plans", require("./routes/eatingPlanComments"));
app.use("/api/users", require("./routes/users"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/banners", require("./routes/banners"));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
