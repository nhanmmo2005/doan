// server/routes/eatingPlanComments.js
const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const filterText = require("../utils/filterText");

const router = express.Router();

/**
 * GET /api/eating-plans/:planId/comments
 * Get comments for an eating plan
 */
router.get("/:planId/comments", async (req, res) => {
  try {
    const planId = Number(req.params.planId);

    // Check if table exists first
    let comments = [];
    try {
      [comments] = await pool.query(
        `
        SELECT
          c.id, c.eating_plan_id, c.user_id, c.content, c.parent_id, c.created_at,
          u.name AS author_name
        FROM eating_plan_comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.eating_plan_id = ?
        ORDER BY c.created_at ASC
        `,
        [planId]
      );
    } catch (e) {
      // Table doesn't exist yet, return empty array
      console.log("eating_plan_comments table not found, returning empty comments");
      comments = [];
    }

    // Build tree structure (same as post comments)
    const map = new Map();
    const roots = [];

    for (const c of comments) {
      map.set(c.id, { ...c, replies: [] });
    }

    for (const c of comments) {
      const node = map.get(c.id);
      if (c.parent_id) {
        const parent = map.get(c.parent_id);
        if (parent) parent.replies.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    }

    res.json(roots);
  } catch (e) {
    console.error("GET COMMENTS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/eating-plans/:planId/comments
 * Create comment on eating plan
 */
router.post("/:planId/comments", auth, async (req, res) => {
  try {
    const planId = Number(req.params.planId);
    const uid = req.user.uid;
    const { content, parentId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: "Bạn chưa nhập nội dung bình luận" });
    }

    // Check if plan exists
    const [plans] = await pool.query("SELECT id FROM eating_plans WHERE id = ? LIMIT 1", [planId]);
    if (!plans.length) {
      return res.status(404).json({ msg: "Không tìm thấy kèo ăn" });
    }

    const safeContent = filterText(content.trim());
    const pId = parentId ? Number(parentId) : null;

    let ins;
    try {
      [ins] = await pool.query(
        `INSERT INTO eating_plan_comments (eating_plan_id, user_id, content, parent_id)
         VALUES (?, ?, ?, ?)`,
        [planId, uid, safeContent, pId]
      );
      res.json({ ok: true, id: ins.insertId });
    } catch (e) {
      // Table doesn't exist
      if (e.code === "ER_NO_SUCH_TABLE") {
        return res.status(400).json({ msg: "Tính năng bình luận chưa được kích hoạt. Vui lòng chạy migration." });
      }
      throw e;
    }
  } catch (e) {
    console.error("CREATE COMMENT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/eating-plans/:planId/comments/:id
 * Delete comment
 */
router.delete("/:planId/comments/:id", auth, async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const uid = req.user.uid;

    // Check ownership
    const [comments] = await pool.query("SELECT user_id FROM eating_plan_comments WHERE id = ? LIMIT 1", [commentId]);
    if (!comments.length) {
      return res.status(404).json({ msg: "Không tìm thấy bình luận" });
    }

    if (comments[0].user_id !== uid) {
      return res.status(403).json({ msg: "Không có quyền xoá bình luận này" });
    }

    try {
      await pool.query("DELETE FROM eating_plan_comments WHERE id = ?", [commentId]);
      res.json({ ok: true });
    } catch (e) {
      if (e.code === "ER_NO_SUCH_TABLE") {
        return res.status(400).json({ msg: "Tính năng bình luận chưa được kích hoạt." });
      }
      throw e;
    }
  } catch (e) {
    console.error("DELETE COMMENT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
