const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const filterText = require("../utils/filterText");

const router = express.Router();

// helper: lấy uid + role (token bạn có thể chưa chứa role)
async function getAuthInfo(req) {
  const uid = req.user?.uid || req.user?.id;
  if (!uid) return { uid: null, role: null };

  let role = req.user?.role || null;
  if (!role) {
    const [u] = await pool.query("SELECT role FROM users WHERE id=? LIMIT 1", [uid]);
    role = u?.[0]?.role || "user";
  }
  return { uid, role };
}

/**
 * GET /api/comments/post/:postId
 * trả về list comment + media (flat), client tự build cây reply
 */
router.get("/post/:postId", async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    if (!postId) return res.status(400).json({ msg: "Invalid postId" });

    const [rows] = await pool.query(
      `
      SELECT
        c.id, c.post_id, c.user_id, c.parent_id,
        c.content, c.created_at,
        u.name AS author_name
      FROM post_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
      `,
      [postId]
    );

    if (!rows.length) return res.json([]);

    const ids = rows.map((x) => x.id);
    const [media] = await pool.query(
      `
      SELECT comment_id, media_type, url, sort_order
      FROM comment_media
      WHERE comment_id IN (?)
      ORDER BY comment_id ASC, sort_order ASC
      `,
      [ids]
    );

    const map = new Map();
    for (const m of media) {
      if (!map.has(m.comment_id)) map.set(m.comment_id, []);
      map.get(m.comment_id).push({
        mediaType: m.media_type,
        url: m.url,
        sortOrder: m.sort_order,
      });
    }

    res.json(rows.map((c) => ({ ...c, media: map.get(c.id) || [] })));
  } catch (e) {
    console.error("GET COMMENTS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/comments/post/:postId
 * body: { content, parentId?, media? [{url, mediaType, sortOrder}] }
 */
router.post("/post/:postId", auth, async (req, res) => {
  try {
    const { uid } = await getAuthInfo(req);
    if (!uid) return res.status(401).json({ msg: "Unauthorized" });

    const postId = Number(req.params.postId);
    if (!postId) return res.status(400).json({ msg: "Invalid postId" });

    const { content, parentId, media } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: "Bạn chưa nhập nội dung bình luận" });
    }

    const safe = filterText(content.trim());

    const parent = parentId ? Number(parentId) : null;
    if (parent) {
      // check parent thuộc cùng post
      const [p] = await pool.query(
        "SELECT id FROM post_comments WHERE id=? AND post_id=? LIMIT 1",
        [parent, postId]
      );
      if (!p.length) return res.status(400).json({ msg: "Reply không hợp lệ" });
    }

    const mediaArr = Array.isArray(media) ? media : [];
    const cleanedMedia = mediaArr
      .filter((m) => m?.url && (m.mediaType === "image" || m.mediaType === "video"))
      .slice(0, 8)
      .map((m, idx) => ({
        url: String(m.url).trim(),
        mediaType: m.mediaType,
        sortOrder: Number.isFinite(Number(m.sortOrder)) ? Number(m.sortOrder) : idx,
      }));

    const [ret] = await pool.query(
      `INSERT INTO post_comments (post_id, user_id, parent_id, content)
       VALUES (?,?,?,?)`,
      [postId, uid, parent || null, safe]
    );

    const commentId = ret.insertId;

    if (cleanedMedia.length) {
      const values = cleanedMedia.map((m) => [commentId, m.mediaType, m.url, m.sortOrder]);
      await pool.query(
        `INSERT INTO comment_media (comment_id, media_type, url, sort_order) VALUES ?`,
        [values]
      );
    }

    res.json({ ok: true, commentId });
  } catch (e) {
    console.error("CREATE COMMENT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/comments/:id
 * chỉ owner hoặc admin
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { uid, role } = await getAuthInfo(req);
    if (!uid) return res.status(401).json({ msg: "Unauthorized" });

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ msg: "Invalid id" });

    const [rows] = await pool.query("SELECT user_id FROM post_comments WHERE id=? LIMIT 1", [id]);
    if (!rows.length) return res.status(404).json({ msg: "Not found" });

    const ownerId = rows[0].user_id;
    if (role !== "admin" && ownerId !== uid) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    await pool.query("DELETE FROM post_comments WHERE id=?", [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE COMMENT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
