// server/routes/chat.js
const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const filterText = require("../utils/filterText");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Optional auth
function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
    }
  } catch {}
  next();
}

/**
 * GET /api/chat/rooms
 * Get all active chat rooms
 */
router.get("/rooms", optionalAuth, async (req, res) => {
  try {
    const [rooms] = await pool.query(
      `
      SELECT
        cr.id, cr.name, cr.description, cr.topic, cr.created_by, cr.status,
        cr.created_at, cr.updated_at,
        u.name AS creator_name,
        (SELECT COUNT(*) FROM chat_messages cm 
         WHERE cm.room_id = cr.id AND cm.status = 'normal') AS message_count,
        (SELECT cm.created_at FROM chat_messages cm 
         WHERE cm.room_id = cr.id AND cm.status = 'normal' 
         ORDER BY cm.created_at DESC LIMIT 1) AS last_message_at
      FROM chat_rooms cr
      JOIN users u ON u.id = cr.created_by
      WHERE cr.status = 'active'
      ORDER BY last_message_at DESC, cr.created_at DESC
      `
    );

    res.json(rooms || []);
  } catch (e) {
    console.error("GET CHAT ROOMS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/chat/rooms/:id
 * Get chat room detail
 */
router.get("/rooms/:id", optionalAuth, async (req, res) => {
  try {
    const roomId = Number(req.params.id);

    const [rooms] = await pool.query(
      `
      SELECT
        cr.id, cr.name, cr.description, cr.topic, cr.created_by, cr.status,
        cr.created_at, cr.updated_at,
        u.name AS creator_name
      FROM chat_rooms cr
      JOIN users u ON u.id = cr.created_by
      WHERE cr.id = ? AND cr.status = 'active'
      LIMIT 1
      `,
      [roomId]
    );

    if (!rooms.length) {
      return res.status(404).json({ msg: "Không tìm thấy phòng chat" });
    }

    res.json(rooms[0]);
  } catch (e) {
    console.error("GET CHAT ROOM ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/chat/rooms
 * Create new chat room (Admin only or allow users)
 */
router.post("/rooms", auth, async (req, res) => {
  try {
    const { name, description, topic } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ msg: "Bạn chưa nhập tên phòng chat" });
    }

    const safeName = filterText(name.trim());
    const safeDescription = description ? filterText(description.trim()) : null;
    const safeTopic = topic ? filterText(topic.trim()) : null;

    const [ins] = await pool.query(
      `INSERT INTO chat_rooms (name, description, topic, created_by, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [safeName, safeDescription, safeTopic, req.user.uid]
    );

    res.json({ ok: true, id: ins.insertId });
  } catch (e) {
    console.error("CREATE CHAT ROOM ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/chat/rooms/:id
 * Delete/Archive chat room (Admin only)
 */
router.delete("/rooms/:id", auth, async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const uid = req.user.uid;

    // Check if user is admin or creator
    const [rooms] = await pool.query(
      "SELECT created_by FROM chat_rooms WHERE id = ? LIMIT 1",
      [roomId]
    );

    if (!rooms.length) {
      return res.status(404).json({ msg: "Không tìm thấy phòng chat" });
    }

    if (rooms[0].created_by !== uid && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Không có quyền xoá phòng chat này" });
    }

    // Archive instead of delete to keep messages
    await pool.query("UPDATE chat_rooms SET status = 'archived' WHERE id = ?", [roomId]);

    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE CHAT ROOM ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/chat/rooms/:roomId/messages
 * Get messages for a chat room
 */
router.get("/rooms/:roomId/messages", optionalAuth, async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const before = req.query.before ? new Date(req.query.before) : null;

    let query = `
      SELECT
        cm.id, cm.room_id, cm.user_id, cm.content, cm.media_url, cm.media_type,
        cm.status, cm.created_at,
        u.name AS author_name,
        u.avatar_url AS author_avatar
      FROM chat_messages cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.room_id = ? AND cm.status = 'normal'
    `;

    const params = [roomId];

    if (before) {
      query += ` AND cm.created_at < ?`;
      params.push(before);
    }

    query += ` ORDER BY cm.created_at DESC LIMIT ?`;
    params.push(limit);

    const [messages] = await pool.query(query, params);

    // Reverse to get chronological order
    res.json(messages.reverse());
  } catch (e) {
    console.error("GET MESSAGES ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/chat/rooms/:roomId/messages
 * Send message in chat room
 */
router.post("/rooms/:roomId/messages", auth, async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const uid = req.user.uid;
    const { content, mediaUrl, mediaType } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: "Bạn chưa nhập nội dung tin nhắn" });
    }

    // Check if room exists and is active
    const [rooms] = await pool.query(
      "SELECT id FROM chat_rooms WHERE id = ? AND status = 'active' LIMIT 1",
      [roomId]
    );

    if (!rooms.length) {
      return res.status(404).json({ msg: "Không tìm thấy phòng chat" });
    }

    const safeContent = filterText(content.trim());
    const safeMediaUrl = mediaUrl || null;
    const safeMediaType = mediaType && ["image", "video"].includes(mediaType) ? mediaType : null;

    const [ins] = await pool.query(
      `INSERT INTO chat_messages (room_id, user_id, content, media_url, media_type, status)
       VALUES (?, ?, ?, ?, ?, 'normal')`,
      [roomId, uid, safeContent, safeMediaUrl, safeMediaType]
    );

    // Get the created message with user info
    const [messages] = await pool.query(
      `
      SELECT
        cm.id, cm.room_id, cm.user_id, cm.content, cm.media_url, cm.media_type,
        cm.status, cm.created_at,
        u.name AS author_name,
        u.avatar_url AS author_avatar
      FROM chat_messages cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.id = ?
      LIMIT 1
      `,
      [ins.insertId]
    );

    res.json(messages[0] || { ok: true, id: ins.insertId });
  } catch (e) {
    console.error("SEND MESSAGE ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/chat/rooms/:roomId/messages/:id
 * Delete message (user can delete own, admin can delete any)
 */
router.delete("/rooms/:roomId/messages/:id", auth, async (req, res) => {
  try {
    const messageId = Number(req.params.id);
    const uid = req.user.uid;

    // Check ownership
    const [messages] = await pool.query(
      "SELECT user_id FROM chat_messages WHERE id = ? LIMIT 1",
      [messageId]
    );

    if (!messages.length) {
      return res.status(404).json({ msg: "Không tìm thấy tin nhắn" });
    }

    if (messages[0].user_id !== uid && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Không có quyền xoá tin nhắn này" });
    }

    // Mark as deleted instead of actually deleting
    await pool.query("UPDATE chat_messages SET status = 'deleted' WHERE id = ?", [messageId]);

    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE MESSAGE ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
