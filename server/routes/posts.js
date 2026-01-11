const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const filterText = require("../utils/filterText");

const router = express.Router();

async function getRoleByUid(uid, req) {
  if (!uid) return "user";
  if (req.user?.role) return req.user.role;
  const [u] = await pool.query("SELECT role FROM users WHERE id=? LIMIT 1", [uid]);
  return u?.[0]?.role || "user";
}

async function assertOwnerOrAdmin(postId, uid, role) {
  const [rows] = await pool.query("SELECT user_id FROM posts WHERE id=? LIMIT 1", [postId]);
  if (!rows.length) return { ok: false, code: 404, msg: "Not found" };
  const ownerId = rows[0].user_id;
  if (role === "admin" || ownerId === uid) return { ok: true, ownerId };
  return { ok: false, code: 403, msg: "Forbidden" };
}

/**
 * GET /api/posts
 * Feed: lấy bài public + media
 */
router.get("/", async (req, res) => {
  try {
    const [posts] = await pool.query(`
      SELECT
        p.id, p.user_id, p.type, p.content, p.rating, p.created_at,
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
    if (!ids.length) return res.json([]);

    const [media] = await pool.query(
      `
      SELECT post_id, media_type, url, sort_order
      FROM post_media
      WHERE post_id IN (?)
      ORDER BY post_id DESC, sort_order ASC
      `,
      [ids]
    );

    const map = new Map();
    for (const m of media) {
      if (!map.has(m.post_id)) map.set(m.post_id, []);
      map.get(m.post_id).push({
        mediaType: m.media_type,
        url: m.url,
        sortOrder: m.sort_order,
      });
    }

    res.json(posts.map((p) => ({ ...p, media: map.get(p.id) || [] })));
  } catch (e) {
    console.error("GET POSTS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/posts
 * body:
 *  - type: "status" | "review"
 *  - content
 *  - restaurantId (required if review)
 *  - rating (required if review)
 *  - media: [{ url, mediaType, sortOrder }]
 */
router.post("/", auth, async (req, res) => {
  try {
    const uid = req.user?.uid || req.user?.id;
    if (!uid) return res.status(401).json({ msg: "Unauthorized" });

    const { type, restaurantId, rating, content, media } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: "Bạn chưa nhập nội dung" });
    }

    const postType = type === "review" ? "review" : "status";
    const safeContent = filterText(content.trim());

    const mediaArr = Array.isArray(media) ? media : [];
    const cleanedMedia = mediaArr
      .filter((m) => m?.url && (m.mediaType === "image" || m.mediaType === "video"))
      .slice(0, 10)
      .map((m, idx) => ({
        url: String(m.url).trim(),
        mediaType: m.mediaType,
        sortOrder: Number.isFinite(Number(m.sortOrder)) ? Number(m.sortOrder) : idx,
      }));

    // Validate review
    if (postType === "review") {
      if (!restaurantId) return res.status(400).json({ msg: "Review phải chọn quán ăn" });
      const r = Number(rating);
      if (Number.isNaN(r) || r < 1 || r > 5) {
        return res.status(400).json({ msg: "Rating phải từ 1 đến 5" });
      }
    }

    const [ret] = await pool.query(
      postType === "status"
        ? `INSERT INTO posts (user_id, type, content, visibility)
           VALUES (?, 'status', ?, 'public')`
        : `INSERT INTO posts (user_id, type, restaurant_id, rating, content, visibility)
           VALUES (?, 'review', ?, ?, ?, 'public')`,
      postType === "status"
        ? [uid, safeContent]
        : [uid, Number(restaurantId), Number(rating), safeContent]
    );

    const postId = ret.insertId;

    if (cleanedMedia.length) {
      const values = cleanedMedia.map((m) => [postId, m.mediaType, m.url, m.sortOrder]);
      await pool.query(
        `INSERT INTO post_media (post_id, media_type, url, sort_order) VALUES ?`,
        [values]
      );
    }

    res.json({ ok: true, postId });
  } catch (e) {
    console.error("CREATE POST ERROR:", e);
    res.status(500).json({ msg: "Server error", detail: e.sqlMessage || e.message });
  }
});

/**
 * PUT /api/posts/:id
 * sửa bài (content + media)
 * body: { content, media? }
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const uid = req.user?.uid || req.user?.id;
    if (!uid) return res.status(401).json({ msg: "Unauthorized" });

    const postId = Number(req.params.id);
    if (!postId) return res.status(400).json({ msg: "Invalid id" });

    const role = await getRoleByUid(uid, req);
    const perm = await assertOwnerOrAdmin(postId, uid, role);
    if (!perm.ok) return res.status(perm.code).json({ msg: perm.msg });

    const { content, media } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: "Nội dung không được rỗng" });
    }

    const safeContent = filterText(content.trim());

    const mediaArr = Array.isArray(media) ? media : [];
    const cleanedMedia = mediaArr
      .filter((m) => m?.url && (m.mediaType === "image" || m.mediaType === "video"))
      .slice(0, 10)
      .map((m, idx) => ({
        url: String(m.url).trim(),
        mediaType: m.mediaType,
        sortOrder: Number.isFinite(Number(m.sortOrder)) ? Number(m.sortOrder) : idx,
      }));

    await pool.query("UPDATE posts SET content=? WHERE id=?", [safeContent, postId]);

    // replace media
    await pool.query("DELETE FROM post_media WHERE post_id=?", [postId]);
    if (cleanedMedia.length) {
      const values = cleanedMedia.map((m) => [postId, m.mediaType, m.url, m.sortOrder]);
      await pool.query(
        `INSERT INTO post_media (post_id, media_type, url, sort_order) VALUES ?`,
        [values]
      );
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("UPDATE POST ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/posts/:id
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const uid = req.user?.uid || req.user?.id;
    if (!uid) return res.status(401).json({ msg: "Unauthorized" });

    const postId = Number(req.params.id);
    if (!postId) return res.status(400).json({ msg: "Invalid id" });

    const role = await getRoleByUid(uid, req);
    const perm = await assertOwnerOrAdmin(postId, uid, role);
    if (!perm.ok) return res.status(perm.code).json({ msg: perm.msg });

    await pool.query("DELETE FROM posts WHERE id=?", [postId]);
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
    const uid = req.user?.uid || req.user?.id;
    if (!uid) return res.status(401).json({ msg: "Unauthorized" });

    const [exist] = await pool.query(
      "SELECT 1 FROM post_likes WHERE post_id=? AND user_id=? LIMIT 1",
      [postId, uid]
    );

    if (exist.length) {
      await pool.query("DELETE FROM post_likes WHERE post_id=? AND user_id=?", [postId, uid]);
      return res.json({ liked: false });
    }

    await pool.query("INSERT INTO post_likes(post_id, user_id) VALUES(?,?)", [postId, uid]);
    res.json({ liked: true });
  } catch (e) {
    console.error("LIKE ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
