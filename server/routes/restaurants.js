const express = require("express");
const pool = require("../db");
const router = express.Router();

// GET /api/restaurants?search=
router.get("/", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    if (!search) {
      const [rows] = await pool.query(
        "SELECT id, name, area, type, price_range, image_url FROM restaurants ORDER BY name ASC LIMIT 200"
      );
      return res.json(rows);
    }

    const like = `%${search}%`;
    const [rows] = await pool.query(
      "SELECT id, name, area, type, price_range, image_url FROM restaurants WHERE name LIKE ? ORDER BY name ASC LIMIT 200",
      [like]
    );
    res.json(rows);
  } catch (e) {
    console.error("RESTAURANTS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
