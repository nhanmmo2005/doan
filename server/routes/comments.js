// server/routes/comments.js
const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const filterText = require("../utils/filterText");

const router = express.Router();

/**
 * GET /api/comments/post/:postId
 */
router.get("/post/:postId", async (req, res) => {
  try {
    const postId = Number(req.params.postId);

    const [rows] = await pool.query(
      `
      SELECT
        c.id, c.post_id, c.user_id, c.parent_id, c.content, c.created_at,
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
    const [mediaRows] = await pool.query(
      `
      SELECT comment_id, media_type AS mediaType, url, sort_order AS sortOrder
      FROM comment_media
      WHERE comment_id IN (${ids.map(() => "?").join(",")})
      ORDER BY comment_id ASC, sort_order ASC
      `,
      ids
    );

    const map = new Map();
    for (const m of mediaRows) {
      if (!map.has(m.comment_id)) map.set(m.comment_id, []);
      map.get(m.comment_id).push({
        mediaType: m.mediaType,
        url: m.url,
        sortOrder: m.sortOrder,
      });
    }

    res.json(rows.map((c) => ({ ...c, media: map.get(c.id) || [] })));
  } catch (e) {
    console.error("GET COMMENTS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/comments/:postId
 * body: { content, parentId?, media?[] }
 */
router.post("/:postId", auth, async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const { content, parentId, media } = req.body;

    if (!content || !content.trim()) return res.status(400).json({ msg: "Bạn chưa nhập nội dung bình luận" });

    const safe = filterText(content.trim());
    const pId = parentId ? Number(parentId) : null;

    const [ins] = await pool.query(
      `INSERT INTO post_comments (post_id, user_id, parent_id, content)
       VALUES (?, ?, ?, ?)`,
      [postId, req.user.uid, pId, safe]
    );

    const commentId = ins.insertId;

    if (Array.isArray(media) && media.length) {
      const rows = media
        .filter((m) => m && m.url && (m.mediaType === "image" || m.mediaType === "video"))
        .map((m, idx) => [commentId, m.mediaType, m.url, Number(m.sortOrder ?? idx)]);
      if (rows.length) {
        await pool.query(
          `INSERT INTO comment_media (comment_id, media_type, url, sort_order) VALUES ?`,
          [rows]
        );
      }
    }

    res.json({ ok: true, id: commentId });
  } catch (e) {
    console.error("CREATE COMMENT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * PUT /api/comments/:id  (edit comment)
 * body: { content, media?[] }  // nếu gửi media thì replace
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const uid = req.user.uid;

    const [rows] = await pool.query("SELECT user_id FROM post_comments WHERE id=? LIMIT 1", [id]);
    if (!rows.length) return res.status(404).json({ msg: "Không tìm thấy bình luận" });
    if (rows[0].user_id !== uid) return res.status(403).json({ msg: "Không có quyền sửa bình luận" });

    const { content, media } = req.body;

    if (typeof content === "string") {
      const safe = filterText(content.trim());
      if (!safe) return res.status(400).json({ msg: "Nội dung không được rỗng" });
      await pool.query("UPDATE post_comments SET content=? WHERE id=?", [safe, id]);
    }

    if (Array.isArray(media)) {
      await pool.query("DELETE FROM comment_media WHERE comment_id=?", [id]);

      const rows2 = media
        .filter((m) => m && m.url && (m.mediaType === "image" || m.mediaType === "video"))
        .map((m, idx) => [id, m.mediaType, m.url, Number(m.sortOrder ?? idx)]);

      if (rows2.length) {
        await pool.query(
          `INSERT INTO comment_media (comment_id, media_type, url, sort_order) VALUES ?`,
          [rows2]
        );
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("EDIT COMMENT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/comments/:id
 * (xoá comment + replies trực tiếp 1 tầng để tránh FK)
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const uid = req.user.uid;

    const [rows] = await pool.query("SELECT user_id FROM post_comments WHERE id=? LIMIT 1", [id]);
    if (!rows.length) return res.status(404).json({ msg: "Không tìm thấy bình luận" });
    if (rows[0].user_id !== uid) return res.status(403).json({ msg: "Không có quyền xoá bình luận" });

    // delete media of replies + main
    await pool.query(
      `DELETE cm FROM comment_media cm
       JOIN post_comments c ON c.id = cm.comment_id
       WHERE c.id = ? OR c.parent_id = ?`,
      [id, id]
    );

    // delete direct replies
    await pool.query("DELETE FROM post_comments WHERE parent_id = ?", [id]);
    // delete main
    await pool.query("DELETE FROM post_comments WHERE id = ?", [id]);

    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE COMMENT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
