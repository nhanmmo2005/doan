// server/routes/posts.js
const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const filterText = require("../utils/filterText");

const router = express.Router();

async function canManagePost(postId, uid) {
  const [rows] = await pool.query("SELECT user_id FROM posts WHERE id = ? LIMIT 1", [postId]);
  if (!rows.length) return { ok: false, reason: "NOT_FOUND" };
  return { ok: rows[0].user_id === uid, ownerId: rows[0].user_id };
}

/**
 * GET /api/posts
 * Feed: public posts
 */
router.get("/", async (req, res) => {
  try {
    const [posts] = await pool.query(`
      SELECT
        p.id, p.user_id, p.type, p.content, p.rating, p.created_at,
        p.restaurant_id, p.visibility,
        u.name AS author_name,
        r.name AS restaurant_name,
        r.area AS restaurant_area,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comment_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.visibility = 'public'
      ORDER BY p.created_at DESC
      LIMIT 50
    `);

    const ids = posts.map((p) => p.id);
    let mediaByPost = new Map();
    if (ids.length) {
      const [mediaRows] = await pool.query(
        `SELECT post_id, media_type AS mediaType, url, sort_order AS sortOrder
         FROM post_media
         WHERE post_id IN (${ids.map(() => "?").join(",")})
         ORDER BY post_id ASC, sort_order ASC`,
        ids
      );
      for (const m of mediaRows) {
        if (!mediaByPost.has(m.post_id)) mediaByPost.set(m.post_id, []);
        mediaByPost.get(m.post_id).push({
          mediaType: m.mediaType,
          url: m.url,
          sortOrder: m.sortOrder,
        });
      }
    }

    res.json(
      posts.map((p) => ({
        ...p,
        media: mediaByPost.get(p.id) || [],
      }))
    );
  } catch (e) {
    console.error("GET POSTS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/posts/:id
 * Detail
 */
router.get("/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const [rows] = await pool.query(
      `
      SELECT
        p.id, p.user_id, p.type, p.content, p.rating, p.created_at,
        p.restaurant_id, p.visibility,
        u.name AS author_name,
        r.name AS restaurant_name,
        r.area AS restaurant_area,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comment_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.id = ?
      LIMIT 1
      `,
      [postId]
    );

    if (!rows.length) return res.status(404).json({ msg: "Không tìm thấy bài viết" });

    const post = rows[0];
    const [mediaRows] = await pool.query(
      `SELECT media_type AS mediaType, url, sort_order AS sortOrder
       FROM post_media WHERE post_id = ? ORDER BY sort_order ASC`,
      [postId]
    );

    res.json({
      ...post,
      media: mediaRows || [],
    });
  } catch (e) {
    console.error("GET POST DETAIL ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/posts
 * body: { content, restaurantId?, rating?, type?, media?[] }
 */
router.post("/", auth, async (req, res) => {
  try {
    const { type, restaurantId, rating, content, media } = req.body;

    if (!content || !content.trim()) return res.status(400).json({ msg: "Bạn chưa nhập nội dung" });

    const postType = type === "review" ? "review" : "status";
    const safeContent = filterText(content.trim());

    let rId = null;
    let r = null;

    if (postType === "review") {
      if (!restaurantId) return res.status(400).json({ msg: "Review phải chọn quán ăn" });
      rId = Number(restaurantId);
      r = Number(rating);
      if (Number.isNaN(r) || r < 1 || r > 5) return res.status(400).json({ msg: "Rating phải từ 1 đến 5" });
    }

    const [ins] = await pool.query(
      `INSERT INTO posts (user_id, type, restaurant_id, rating, content, visibility)
       VALUES (?, ?, ?, ?, ?, 'public')`,
      [req.user.uid, postType, rId, r, safeContent]
    );

    const postId = ins.insertId;

    // media: [{mediaType,url,sortOrder}]
    if (Array.isArray(media) && media.length) {
      const rows = media
        .filter((m) => m && m.url && (m.mediaType === "image" || m.mediaType === "video"))
        .map((m, idx) => [postId, m.mediaType, m.url, Number(m.sortOrder ?? idx)]);
      if (rows.length) {
        await pool.query(
          `INSERT INTO post_media (post_id, media_type, url, sort_order) VALUES ?`,
          [rows]
        );
      }
    }

    res.json({ ok: true, id: postId });
  } catch (e) {
    console.error("CREATE POST ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * PUT /api/posts/:id  (edit)
 * body: { content, visibility?, media?[] }
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const uid = req.user.uid;

    const { content, visibility, media } = req.body;

    const check = await canManagePost(postId, uid);
    if (!check.ok) return res.status(404).json({ msg: "Không tìm thấy bài viết" });
    if (check.ownerId !== uid) return res.status(403).json({ msg: "Không có quyền sửa bài" });

    if (typeof content === "string") {
      const safe = filterText(content.trim());
      if (!safe) return res.status(400).json({ msg: "Nội dung không được rỗng" });
      await pool.query("UPDATE posts SET content = ? WHERE id = ?", [safe, postId]);
    }

    if (visibility === "public" || visibility === "hidden") {
      await pool.query("UPDATE posts SET visibility = ? WHERE id = ?", [visibility, postId]);
    }

    // Nếu gửi media -> replace
    if (Array.isArray(media)) {
      await pool.query("DELETE FROM post_media WHERE post_id = ?", [postId]);

      const rows = media
        .filter((m) => m && m.url && (m.mediaType === "image" || m.mediaType === "video"))
        .map((m, idx) => [postId, m.mediaType, m.url, Number(m.sortOrder ?? idx)]);

      if (rows.length) {
        await pool.query(
          `INSERT INTO post_media (post_id, media_type, url, sort_order) VALUES ?`,
          [rows]
        );
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("EDIT POST ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/posts/:id
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const uid = req.user.uid;

    const check = await canManagePost(postId, uid);
    if (!check.ok) return res.status(404).json({ msg: "Không tìm thấy bài viết" });
    if (check.ownerId !== uid) return res.status(403).json({ msg: "Không có quyền xoá bài" });

    // delete children first (safe for FK)
    await pool.query("DELETE FROM post_likes WHERE post_id = ?", [postId]);

    await pool.query(
      `DELETE cm FROM comment_media cm
       JOIN post_comments pc ON pc.id = cm.comment_id
       WHERE pc.post_id = ?`,
      [postId]
    );
    await pool.query("DELETE FROM post_comments WHERE post_id = ?", [postId]);

    await pool.query("DELETE FROM post_media WHERE post_id = ?", [postId]);
    await pool.query("DELETE FROM posts WHERE id = ?", [postId]);

    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE POST ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/posts/:id/like (toggle)
 */
router.post("/:id/like", auth, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const uid = req.user.uid;

    const [exist] = await pool.query("SELECT 1 FROM post_likes WHERE post_id=? AND user_id=?", [postId, uid]);

    if (exist.length) {
      await pool.query("DELETE FROM post_likes WHERE post_id=? AND user_id=?", [postId, uid]);
      return res.json({ liked: false });
    } else {
      await pool.query("INSERT INTO post_likes(post_id, user_id) VALUES(?,?)", [postId, uid]);
      return res.json({ liked: true });
    }
  } catch (e) {
    console.error("LIKE ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
