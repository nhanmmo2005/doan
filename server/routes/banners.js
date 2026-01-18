// server/routes/banners.js
const express = require("express");
const pool = require("../db");
const optionalAuth = require("../middleware/optionalAuth");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

/**
 * GET /api/banners
 * Lấy danh sách banners đang active (public)
 * Query: ?type=promotion|booking
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { type } = req.query;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    let query = `
      SELECT 
        b.id,
        b.restaurant_id,
        b.title,
        b.description,
        b.banner_type,
        b.image_url,
        b.link_url,
        b.start_date,
        b.end_date,
        b.sort_order,
        r.name AS restaurant_name,
        r.image_url AS restaurant_image,
        r.address AS restaurant_address
      FROM restaurant_banners b
      LEFT JOIN restaurants r ON r.id = b.restaurant_id
      WHERE b.is_active = 1
        AND (b.start_date IS NULL OR b.start_date <= ?)
        AND (b.end_date IS NULL OR b.end_date >= ?)
    `;

    const params = [now, now];

    if (type === "promotion" || type === "booking") {
      query += ` AND b.banner_type = ?`;
      params.push(type);
    }

    query += ` ORDER BY b.sort_order ASC, b.created_at DESC LIMIT 10`;

    const [rows] = await pool.query(query, params);
    res.json(rows || []);
  } catch (e) {
    // Nếu bảng chưa tồn tại, trả về mảng rỗng thay vì lỗi
    if (e.code === "ER_NO_SUCH_TABLE") {
      console.warn("restaurant_banners table does not exist yet. Please run migration.");
      return res.json([]);
    }
    console.error("GET BANNERS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/banners/:id
 * Lấy chi tiết 1 banner
 */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query(
      `
      SELECT 
        b.*,
        r.name AS restaurant_name,
        r.image_url AS restaurant_image,
        r.address AS restaurant_address
      FROM restaurant_banners b
      LEFT JOIN restaurants r ON r.id = b.restaurant_id
      WHERE b.id = ?
    `,
      [id]
    );

    if (!rows.length) return res.status(404).json({ msg: "Không tìm thấy banner" });
    res.json(rows[0]);
  } catch (e) {
    console.error("GET BANNER ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

// ========== ADMIN ROUTES ==========

/**
 * GET /api/banners/admin/all
 * Lấy tất cả banners (admin)
 */
router.get("/admin/all", auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        b.*,
        r.name AS restaurant_name
      FROM restaurant_banners b
      LEFT JOIN restaurants r ON r.id = b.restaurant_id
      ORDER BY b.sort_order ASC, b.created_at DESC
    `
    );
    res.json(rows || []);
  } catch (e) {
    if (e.code === "ER_NO_SUCH_TABLE") {
      console.warn("restaurant_banners table does not exist yet. Please run migration.");
      return res.json([]);
    }
    console.error("GET ALL BANNERS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/banners/admin
 * Tạo banner mới (admin)
 * Body: { restaurant_id, title, description, banner_type, image_url, link_url, start_date, end_date, sort_order }
 */
router.post("/admin", auth, adminOnly, async (req, res) => {
  try {
    const {
      restaurant_id,
      title,
      description,
      banner_type = "promotion",
      image_url,
      link_url,
      start_date,
      end_date,
      sort_order = 0,
    } = req.body;

    if (!title) {
      return res.status(400).json({ msg: "Thiếu title" });
    }

    const [ins] = await pool.query(
      `
      INSERT INTO restaurant_banners 
        (restaurant_id, title, description, banner_type, image_url, link_url, start_date, end_date, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        restaurant_id || null,
        title,
        description || null,
        banner_type,
        image_url || null,
        link_url || null,
        start_date || null,
        end_date || null,
        sort_order,
      ]
    );

    res.json({ ok: true, id: ins.insertId });
  } catch (e) {
    console.error("CREATE BANNER ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * PUT /api/banners/admin/:id
 * Cập nhật banner (admin)
 */
router.put("/admin/:id", auth, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      restaurant_id,
      title,
      description,
      banner_type,
      image_url,
      link_url,
      start_date,
      end_date,
      is_active,
      sort_order,
    } = req.body;

    const updates = [];
    const params = [];

    if (restaurant_id !== undefined) {
      updates.push("restaurant_id = ?");
      params.push(restaurant_id);
    }
    if (title !== undefined) {
      updates.push("title = ?");
      params.push(title);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description || null);
    }
    if (banner_type !== undefined) {
      updates.push("banner_type = ?");
      params.push(banner_type);
    }
    if (image_url !== undefined) {
      updates.push("image_url = ?");
      params.push(image_url || null);
    }
    if (link_url !== undefined) {
      updates.push("link_url = ?");
      params.push(link_url || null);
    }
    if (start_date !== undefined) {
      updates.push("start_date = ?");
      params.push(start_date || null);
    }
    if (end_date !== undefined) {
      updates.push("end_date = ?");
      params.push(end_date || null);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      params.push(is_active ? 1 : 0);
    }
    if (sort_order !== undefined) {
      updates.push("sort_order = ?");
      params.push(sort_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({ msg: "Không có dữ liệu để cập nhật" });
    }

    params.push(id);

    await pool.query(
      `UPDATE restaurant_banners SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("UPDATE BANNER ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/banners/admin/:id
 * Xóa banner (admin)
 */
router.delete("/admin/:id", auth, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query("DELETE FROM restaurant_banners WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE BANNER ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
