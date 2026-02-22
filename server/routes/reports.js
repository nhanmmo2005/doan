const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const filterText = require("../utils/filterText");

const router = express.Router();

/**
 * POST /api/reports
 * Báo cáo nội dung vi phạm
 * Body: { target_type, target_id, reason, reason_text }
 */
router.post("/", auth, async (req, res) => {
  try {
    const { target_type, target_id, reason, reason_text } = req.body;
    const userId = req.user.uid;

    if (!target_type || !target_id || !reason) {
      return res.status(400).json({ msg: "Thiếu thông tin báo cáo" });
    }

    const validTypes = [
      "post",
      "eating_plan",
      "post_comment",
      "review_comment",
      "eating_plan_comment",
      "message",
      "restaurant_comment",
    ];

    if (!validTypes.includes(target_type)) {
      return res.status(400).json({ msg: "Loại nội dung báo cáo không hợp lệ" });
    }

    // Check if duplicate report (pending or reviewing)
    const [existing] = await pool.query(
      `SELECT id FROM reports 
       WHERE reporter_user_id = ? AND target_type = ? AND target_id = ? 
       AND status IN ('pending', 'reviewing') LIMIT 1`,
      [userId, target_type, target_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ msg: "Bạn đã gửi báo cáo cho nội dung này và đang được chờ xử lý." });
    }

    // Insert report
    await pool.query(
      `INSERT INTO reports (reporter_user_id, target_type, target_id, reason, reason_text)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, target_type, target_id, reason, reason_text ? filterText(reason_text.trim()) : null]
    );

    res.json({ ok: true, msg: "Báo cáo của bạn đã được gửi tới quản trị viên. Cảm ơn bạn!" });
  } catch (e) {
    console.error("CREATE REPORT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
