const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const filterText = require("../utils/filterText");

const router = express.Router();

/**
 * Helper: lấy media cho 1 list postIds
 */
async function attachMediaToPosts(posts) {
  if (!posts || posts.length === 0) return posts;

  const ids = posts.map((p) => p.id);
  const [mediaRows] = await pool.query(
    `
    SELECT post_id, media_type, url, sort_order
    FROM post_media
    WHERE post_id IN (?)
    ORDER BY post_id ASC, sort_order ASC
  `,
    [ids]
  );

  const map = new Map();
  for (const m of mediaRows) {
    if (!map.has(m.post_id)) map.set(m.post_id, []);
    map.get(m.post_id).push({
      mediaType: m.media_type, // "image" | "video"
      url: m.url,
      sortOrder: m.sort_order,
    });
  }

  return posts.map((p) => ({
    ...p,
    media: map.get(p.id) || (p.image_url ? [{ mediaType: "image", url: p.image_url, sortOrder: 0 }] : []),
  }));
}

/**
 * GET /api/posts
 * Feed: bài public (không chặn pending để tránh feed thấy mà detail không thấy)
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.type,
        p.content,
        p.rating,
        p.created_at,
        p.visibility,
        p.status,
        p.image_url,
        u.id   AS author_id,
        u.name AS author_name,
        r.id   AS restaurant_id,
        r.name AS restaurant_name,
        r.area AS restaurant_area,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comment_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.visibility = 'public'
        AND (p.status IS NULL OR p.status <> 'rejected')
      ORDER BY p.created_at DESC
      LIMIT 50
    `);

    const posts = await attachMediaToPosts(rows);
    res.json(posts);
  } catch (e) {
    console.error("GET POSTS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/posts/:id
 * Post detail public share
 */
router.get("/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!postId) return res.status(400).json({ msg: "ID không hợp lệ" });

    const [rows] = await pool.query(
      `
      SELECT
        p.id,
        p.type,
        p.content,
        p.rating,
        p.created_at,
        p.visibility,
        p.status,
        p.image_url,
        u.id   AS author_id,
        u.name AS author_name,
        r.id   AS restaurant_id,
        r.name AS restaurant_name,
        r.area AS restaurant_area,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comment_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.id = ?
        AND p.visibility = 'public'
        AND (p.status IS NULL OR p.status <> 'rejected')
      LIMIT 1
    `,
      [postId]
    );

    if (!rows.length) {
      return res.status(404).json({ msg: "Không tìm thấy bài viết" });
    }

    const [post] = await attachMediaToPosts(rows);
    res.json(post);
  } catch (e) {
    console.error("GET POST DETAIL ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/posts
 * body:
 *  - type: "status" | "review"
 *  - content
 *  - restaurantId (optional)
 *  - rating (optional)
 *  - media: [{ mediaType:"image"|"video", url, sortOrder }]
 */
router.post("/", auth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { type, restaurantId, rating, content, media } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: "Bạn chưa nhập nội dung" });
    }

    const postType = type === "review" ? "review" : "status";
    const safeContent = filterText(content.trim());

    if (postType === "review") {
      if (!restaurantId) return res.status(400).json({ msg: "Review phải chọn quán ăn" });
      const r = Number(rating);
      if (Number.isNaN(r) || r < 1 || r > 5) return res.status(400).json({ msg: "Rating phải từ 1 đến 5" });
    }

    // Cho đồ án: auto approved để share/detail luôn load được
    const statusValue = "approved";

    const [ret] = await pool.query(
      postType === "status"
        ? `INSERT INTO posts (user_id, type, content, visibility, status)
           VALUES (?, 'status', ?, 'public', ?)`
        : `INSERT INTO posts (user_id, type, restaurant_id, rating, content, visibility, status)
           VALUES (?, 'review', ?, ?, ?, 'public', ?)`,
      postType === "status"
        ? [uid, safeContent, statusValue]
        : [uid, Number(restaurantId), Number(rating), safeContent, statusValue]
    );

    const postId = ret.insertId;

    // Insert media nếu có
    if (Array.isArray(media) && media.length) {
      const values = media
        .filter((m) => m && m.url && (m.mediaType === "image" || m.mediaType === "video"))
        .map((m, idx) => [postId, m.mediaType, m.url, Number(m.sortOrder ?? idx)]);

      if (values.length) {
        await pool.query(
          `INSERT INTO post_media (post_id, media_type, url, sort_order) VALUES ?`,
          [values]
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
 * POST /api/posts/:id/like  (toggle)
 */
router.post("/:id/like", auth, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const uid = req.user.uid;

    const [exist] = await pool.query(
      "SELECT 1 FROM post_likes WHERE post_id=? AND user_id=?",
      [postId, uid]
    );

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
