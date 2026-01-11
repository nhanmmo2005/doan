const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

/**
 * GET /api/admin/posts
 * Lấy post public để admin quản lý (ẩn/hiện), chưa cần duyệt
 */
router.get("/posts", auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id, p.type, p.content, p.image_url, p.rating, p.visibility, p.created_at,
        u.name AS author_name,
        r.name AS restaurant_name
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN restaurants r ON r.id = p.restaurant_id
      ORDER BY p.created_at DESC
      LIMIT 100
    `);

    res.json(rows);
  } catch (e) {
    console.error("ADMIN POSTS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * PATCH /api/admin/posts/:id/visibility
 * body: { visibility: "public" | "hidden" }
 */
router.patch("/posts/:id/visibility", auth, adminOnly, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const { visibility } = req.body;

    if (!["public", "hidden"].includes(visibility)) {
      return res.status(400).json({ msg: "visibility invalid" });
    }

    await pool.query("UPDATE posts SET visibility=? WHERE id=?", [visibility, postId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN VISIBILITY ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
