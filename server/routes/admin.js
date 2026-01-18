const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

// ============================================================
// DASHBOARD & STATS
// ============================================================

/**
 * GET /api/admin/stats
 * Lấy thống kê tổng quan
 */
router.get("/stats", auth, adminOnly, async (req, res) => {
  try {
    const [userStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN locked = 1 THEN 1 ELSE 0 END) as locked
      FROM users
    `);

    const [postStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN visibility = 'hidden' THEN 1 ELSE 0 END) as hidden
      FROM posts
    `);

    const [reviewStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM restaurant_reviews
    `);

    const [restaurantStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured
      FROM restaurants
    `);

    const [eatingPlanStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open
      FROM eating_plans
      WHERE status != 'deleted'
    `);

    const [chatStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_rooms,
        (SELECT COUNT(*) FROM chat_messages) as total_messages
      FROM chat_rooms
      WHERE status = 'active'
    `);

    res.json({
      users: userStats[0],
      posts: postStats[0],
      reviews: reviewStats[0],
      restaurants: restaurantStats[0],
      eatingPlans: eatingPlanStats[0],
      chat: chatStats[0],
    });
  } catch (e) {
    console.error("ADMIN STATS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// POSTS MANAGEMENT
// ============================================================

/**
 * GET /api/admin/posts
 * Lấy tất cả posts với filter
 */
router.get("/posts", auth, adminOnly, async (req, res) => {
  try {
    const { status, visibility, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT
        p.id, p.type, p.content, p.image_url, p.rating, p.visibility, p.status, p.created_at,
        u.id AS author_id, u.name AS author_name, u.email AS author_email,
        r.id AS restaurant_id, r.name AS restaurant_name
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN restaurants r ON r.id = p.restaurant_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += " AND p.status = ?";
      params.push(status);
    }
    if (visibility) {
      query += " AND p.visibility = ?";
      params.push(visibility);
    }

    query += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    console.error("ADMIN POSTS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/admin/posts/pending
 * Lấy posts đang chờ duyệt
 */
router.get("/posts/pending", auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id, p.type, p.content, p.image_url, p.rating, p.created_at,
        u.id AS author_id, u.name AS author_name,
        r.name AS restaurant_name
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.status = 'pending'
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error("ADMIN PENDING POSTS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * PATCH /api/admin/posts/:id/status
 * body: { status: "pending" | "approved" | "rejected" }
 */
router.patch("/posts/:id/status", auth, adminOnly, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ msg: "Status không hợp lệ" });
    }

    await pool.query("UPDATE posts SET status=? WHERE id=?", [status, postId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN POST STATUS ERROR:", e);
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
      return res.status(400).json({ msg: "Visibility không hợp lệ" });
    }

    await pool.query("UPDATE posts SET visibility=? WHERE id=?", [visibility, postId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN VISIBILITY ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/admin/posts/:id
 * Xóa post
 */
router.delete("/posts/:id", auth, adminOnly, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    await pool.query("DELETE FROM posts WHERE id=?", [postId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN DELETE POST ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// USERS MANAGEMENT
// ============================================================

/**
 * GET /api/admin/users
 * Lấy danh sách users
 */
router.get("/users", auth, adminOnly, async (req, res) => {
  try {
    const { role, locked, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT
        u.id, u.name, u.email, u.role, u.locked, u.avatar_url, u.bio, u.created_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count,
        (SELECT COUNT(*) FROM eating_plans WHERE user_id = u.id) AS eating_plan_count,
        (SELECT COUNT(*) FROM restaurant_reviews WHERE user_id = u.id) AS review_count
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += " AND u.role = ?";
      params.push(role);
    }
    if (locked !== undefined) {
      query += " AND u.locked = ?";
      params.push(locked === "true" ? 1 : 0);
    }

    query += " ORDER BY u.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    console.error("ADMIN USERS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * PATCH /api/admin/users/:id/lock
 * body: { locked: true | false }
 */
router.patch("/users/:id/lock", auth, adminOnly, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { locked } = req.body;

    if (userId === req.user.uid) {
      return res.status(400).json({ msg: "Không thể khóa chính mình" });
    }

    await pool.query("UPDATE users SET locked=? WHERE id=?", [locked ? 1 : 0, userId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN LOCK USER ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * body: { role: "user" | "admin" }
 */
router.patch("/users/:id/role", auth, adminOnly, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ msg: "Role không hợp lệ" });
    }

    if (userId === req.user.uid) {
      return res.status(400).json({ msg: "Không thể thay đổi role của chính mình" });
    }

    await pool.query("UPDATE users SET role=? WHERE id=?", [role, userId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN CHANGE ROLE ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Xóa user
 */
router.delete("/users/:id", auth, adminOnly, async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (userId === req.user.uid) {
      return res.status(400).json({ msg: "Không thể xóa chính mình" });
    }

    await pool.query("DELETE FROM users WHERE id=?", [userId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN DELETE USER ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// RESTAURANTS MANAGEMENT
// ============================================================

/**
 * GET /api/admin/restaurants
 * Lấy danh sách restaurants
 */
router.get("/restaurants", auth, adminOnly, async (req, res) => {
  try {
    const { featured, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT
        r.id, r.name, r.type, r.area, r.price_range, r.address, r.meal_time,
        r.latitude, r.longitude, r.image_url,
        r.avg_rating, r.review_count, r.is_featured, r.created_at,
        (SELECT COUNT(*) FROM restaurant_reviews WHERE restaurant_id = r.id) AS review_count_actual
      FROM restaurants r
      WHERE 1=1
    `;
    const params = [];

    if (featured !== undefined) {
      query += " AND r.is_featured = ?";
      params.push(featured === "true" ? 1 : 0);
    }

    query += " ORDER BY r.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    console.error("ADMIN RESTAURANTS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/admin/restaurants/:id
 * Lấy chi tiết restaurant
 */
router.get("/restaurants/:id", auth, adminOnly, async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT * FROM restaurants WHERE id = ?`,
      [restaurantId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error("ADMIN GET RESTAURANT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/admin/restaurants
 * Tạo restaurant mới
 */
router.post("/restaurants", auth, adminOnly, async (req, res) => {
  try {
    const { name, type, area, price_range, address, meal_time, latitude, longitude, image_url, is_featured } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ msg: "Tên quán không được để trống" });
    }

    const [ins] = await pool.query(
      `INSERT INTO restaurants (name, type, area, price_range, address, meal_time, latitude, longitude, image_url, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        type || null,
        area || null,
        price_range || null,
        address || null,
        meal_time || "all",
        latitude || null,
        longitude || null,
        image_url || null,
        is_featured ? 1 : 0,
      ]
    );

    res.json({ ok: true, id: ins.insertId });
  } catch (e) {
    console.error("ADMIN CREATE RESTAURANT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * PUT /api/admin/restaurants/:id
 * Cập nhật restaurant
 */
router.put("/restaurants/:id", auth, adminOnly, async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);
    const { name, type, area, price_range, address, meal_time, latitude, longitude, image_url, is_featured } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ msg: "Tên quán không được để trống" });
    }

    await pool.query(
      `UPDATE restaurants 
       SET name = ?, type = ?, area = ?, price_range = ?, address = ?, 
           meal_time = ?, latitude = ?, longitude = ?, image_url = ?, is_featured = ?
       WHERE id = ?`,
      [
        name.trim(),
        type || null,
        area || null,
        price_range || null,
        address || null,
        meal_time || "all",
        latitude || null,
        longitude || null,
        image_url || null,
        is_featured ? 1 : 0,
        restaurantId,
      ]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN UPDATE RESTAURANT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * PATCH /api/admin/restaurants/:id/featured
 * body: { featured: true | false }
 */
router.patch("/restaurants/:id/featured", auth, adminOnly, async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);
    const { featured } = req.body;

    await pool.query("UPDATE restaurants SET is_featured=? WHERE id=?", [featured ? 1 : 0, restaurantId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN FEATURED RESTAURANT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/admin/restaurants/:id
 * Xóa restaurant
 */
router.delete("/restaurants/:id", auth, adminOnly, async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);
    await pool.query("DELETE FROM restaurants WHERE id=?", [restaurantId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN DELETE RESTAURANT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// EATING PLANS MANAGEMENT
// ============================================================

/**
 * GET /api/admin/eating-plans
 * Lấy danh sách eating plans
 */
router.get("/eating-plans", auth, adminOnly, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT
        ep.id, ep.title, ep.description, ep.planned_at, ep.status, ep.created_at,
        u.id AS creator_id, u.name AS creator_name,
        r.name AS restaurant_name,
        (SELECT COUNT(*) FROM eating_plan_participants WHERE eating_plan_id = ep.id) AS participant_count
      FROM eating_plans ep
      JOIN users u ON u.id = ep.user_id
      LEFT JOIN restaurants r ON r.id = ep.restaurant_id
      WHERE ep.status != 'deleted'
    `;
    const params = [];

    if (status) {
      query += " AND ep.status = ?";
      params.push(status);
    }

    query += " ORDER BY ep.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    console.error("ADMIN EATING PLANS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/admin/eating-plans/:id
 * Xóa eating plan
 */
router.delete("/eating-plans/:id", auth, adminOnly, async (req, res) => {
  try {
    const planId = Number(req.params.id);
    await pool.query("UPDATE eating_plans SET status='deleted' WHERE id=?", [planId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN DELETE EATING PLAN ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// REVIEWS MANAGEMENT
// ============================================================

/**
 * GET /api/admin/reviews
 * Lấy danh sách reviews với filter
 */
router.get("/reviews", auth, adminOnly, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT
        rr.id, rr.restaurant_id, rr.user_id, rr.rating, rr.price_rating, rr.food_rating, rr.hygiene_rating,
        rr.comment, rr.status, rr.created_at,
        u.name AS author_name, u.email AS author_email,
        r.name AS restaurant_name,
        COALESCE((SELECT COUNT(*) FROM review_media WHERE review_id = rr.id), 0) AS media_count,
        COALESCE((SELECT COUNT(*) FROM review_comments WHERE review_id = rr.id), 0) AS comment_count
      FROM restaurant_reviews rr
      JOIN users u ON u.id = rr.user_id
      LEFT JOIN restaurants r ON r.id = rr.restaurant_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += " AND rr.status = ?";
      params.push(status);
    }

    query += " ORDER BY rr.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);

    // Load media for each review (if table exists)
    const reviewIds = rows.map((r) => r.id);
    if (reviewIds.length > 0) {
      try {
        const placeholders = reviewIds.map(() => "?").join(",");
        const [mediaRows] = await pool.query(
          `SELECT review_id, media_type, url, sort_order 
           FROM review_media 
           WHERE review_id IN (${placeholders}) 
           ORDER BY review_id, sort_order`,
          reviewIds
        );

        const mediaMap = {};
        mediaRows.forEach((m) => {
          if (!mediaMap[m.review_id]) mediaMap[m.review_id] = [];
          mediaMap[m.review_id].push({
            type: m.media_type,
            url: m.url,
            sortOrder: m.sort_order,
          });
        });

        rows.forEach((review) => {
          review.media = mediaMap[review.id] || [];
        });
      } catch (e) {
        // Table might not exist yet, just skip media
        console.warn("review_media table might not exist:", e.message);
        rows.forEach((review) => {
          review.media = [];
        });
      }
    }

    res.json(rows);
  } catch (e) {
    console.error("ADMIN REVIEWS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * PATCH /api/admin/reviews/:id/status
 * body: { status: "pending" | "approved" | "rejected" }
 */
router.patch("/reviews/:id/status", auth, adminOnly, async (req, res) => {
  try {
    const reviewId = Number(req.params.id);
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ msg: "Status không hợp lệ" });
    }

    await pool.query("UPDATE restaurant_reviews SET status=? WHERE id=?", [status, reviewId]);

    // If approved, recalculate restaurant stats
    if (status === "approved") {
      const [review] = await pool.query("SELECT restaurant_id FROM restaurant_reviews WHERE id = ?", [reviewId]);
      if (review.length > 0) {
        const restaurantId = review[0].restaurant_id;
        const [stats] = await pool.query(
          `SELECT 
            AVG(rating) AS avg_rating,
            COUNT(*) AS review_count
          FROM restaurant_reviews
          WHERE restaurant_id = ? AND status = 'approved'`,
          [restaurantId]
        );

        const avgRating = stats[0].avg_rating ? parseFloat(stats[0].avg_rating).toFixed(2) : null;
        const reviewCount = stats[0].review_count || 0;

        await pool.query(
          `UPDATE restaurants 
           SET avg_rating = ?, review_count = ?
           WHERE id = ?`,
          [avgRating, reviewCount, restaurantId]
        );
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN REVIEW STATUS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/admin/reviews/:id
 * Xóa review
 */
router.delete("/reviews/:id", auth, adminOnly, async (req, res) => {
  try {
    const reviewId = Number(req.params.id);
    
    // Get restaurant_id before delete
    const [review] = await pool.query("SELECT restaurant_id FROM restaurant_reviews WHERE id = ?", [reviewId]);
    
    await pool.query("DELETE FROM restaurant_reviews WHERE id=?", [reviewId]);

    // Recalculate stats
    if (review.length > 0) {
      const restaurantId = review[0].restaurant_id;
      const [stats] = await pool.query(
        `SELECT 
          AVG(rating) AS avg_rating,
          COUNT(*) AS review_count
        FROM restaurant_reviews
        WHERE restaurant_id = ? AND status = 'approved'`,
        [restaurantId]
      );

      const avgRating = stats[0].avg_rating ? parseFloat(stats[0].avg_rating).toFixed(2) : null;
      const reviewCount = stats[0].review_count || 0;

      await pool.query(
        `UPDATE restaurants 
         SET avg_rating = ?, review_count = ?
         WHERE id = ?`,
        [avgRating, reviewCount, restaurantId]
      );
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN DELETE REVIEW ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// CHAT MANAGEMENT
// ============================================================

/**
 * GET /api/admin/chat-rooms
 * Lấy danh sách chat rooms
 */
router.get("/chat-rooms", auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        cr.id, cr.name, cr.description, cr.topic, cr.status, cr.created_at,
        u.name AS creator_name,
        (SELECT COUNT(*) FROM chat_messages WHERE room_id = cr.id) AS message_count
      FROM chat_rooms cr
      JOIN users u ON u.id = cr.created_by
      ORDER BY cr.created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error("ADMIN CHAT ROOMS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/admin/chat-rooms/:id
 * Xóa chat room
 */
router.delete("/chat-rooms/:id", auth, adminOnly, async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    await pool.query("UPDATE chat_rooms SET status='archived' WHERE id=?", [roomId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN DELETE CHAT ROOM ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
