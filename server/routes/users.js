// server/routes/users.js
const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const filterText = require("../utils/filterText");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { createFollowNotification } = require("../utils/notifications");

// Try to use R2 for uploads if available
let r2, PutObjectCommand;
try {
  r2 = require("../r2");
  PutObjectCommand = require("@aws-sdk/client-s3").PutObjectCommand;
} catch (e) {
  // R2 not configured, use local uploads
  r2 = null;
}

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

// Multer config for avatar upload (memory storage for R2 support)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh"));
    }
  },
});

/**
 * GET /api/users/:id
 * Get user profile
 */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const [users] = await pool.query(
      `
      SELECT
        id, name, email, avatar_url, bio, role, created_at,
        (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) AS follower_count,
        (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.id) AS following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count,
        (SELECT COUNT(*) FROM restaurant_reviews WHERE user_id = u.id) AS review_count
      FROM users u
      WHERE id = ? AND locked = 0
      LIMIT 1
      `,
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ msg: "Không tìm thấy người dùng" });
    }

    const user = users[0];

    // Check if current user is following this user
    let isFollowing = false;
    if (req.user?.uid) {
      const [follows] = await pool.query(
        "SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = ?",
        [req.user.uid, userId]
      );
      isFollowing = follows.length > 0;
    }

    // Get user's posts count (approved)
    const [postCountRows] = await pool.query(
      "SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND visibility = 'public'",
      [userId]
    );
    user.post_count = postCountRows[0]?.count || 0;

    // Get eating plans count
    let eatingPlanCount = 0;
    try {
      const [planCountRows] = await pool.query(
        "SELECT COUNT(*) as count FROM eating_plans WHERE user_id = ?",
        [userId]
      );
      eatingPlanCount = planCountRows[0]?.count || 0;
    } catch (e) {
      // Table might not exist
    }

    res.json({
      ...user,
      is_following: isFollowing,
      is_me: req.user?.uid === userId,
      eating_plan_count: eatingPlanCount,
    });
  } catch (e) {
    console.error("GET USER PROFILE ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * PUT /api/users/:id
 * Update user profile
 */
router.put("/:id", auth, upload.single("avatar"), async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const uid = req.user.uid;

    // Only user can update their own profile (unless admin)
    if (userId !== uid && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Không có quyền sửa profile này" });
    }

    const { name, bio } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(filterText(name.trim()));
    }

    if (bio !== undefined) {
      updates.push("bio = ?");
      params.push(bio ? filterText(bio.trim()) : null);
    }

    // Handle avatar upload
    if (req.file) {
      let avatarUrl;

      // Use R2 if available
      if (r2 && process.env.R2_BUCKET && process.env.R2_PUBLIC_BASE_URL) {
        const ext = path.extname(req.file.originalname || "");
        const rand = crypto.randomBytes(8).toString("hex");
        const key = `avatars/${Date.now()}-${rand}${ext}`;

        const cmd = new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        });

        await r2.send(cmd);
        avatarUrl = `${process.env.R2_PUBLIC_BASE_URL}/${key}`;
      } else {
        // Local upload
        const uploadsDir = path.join(process.cwd(), "uploads", "avatars");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const ext = path.extname(req.file.originalname || "");
        const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
        const filepath = path.join(uploadsDir, filename);

        fs.writeFileSync(filepath, req.file.buffer);
        avatarUrl = `/uploads/avatars/${filename}`;
      }

      // Delete old avatar if exists (only for local uploads)
      const [oldUser] = await pool.query("SELECT avatar_url FROM users WHERE id = ?", [userId]);
      if (oldUser[0]?.avatar_url && oldUser[0].avatar_url.startsWith("/uploads/avatars/")) {
        const oldPath = path.join(process.cwd(), "public", oldUser[0].avatar_url);
        try {
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (e) {}
      }

      updates.push("avatar_url = ?");
      params.push(avatarUrl);
    }

    if (updates.length === 0) {
      return res.json({ ok: true });
    }

    params.push(userId);
    await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);

    res.json({ ok: true });
  } catch (e) {
    console.error("UPDATE PROFILE ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/users/:id/follow
 * Follow a user
 */
router.post("/:id/follow", auth, async (req, res) => {
  try {
    const followingId = Number(req.params.id);
    const followerId = req.user.uid;

    if (followingId === followerId) {
      return res.status(400).json({ msg: "Không thể follow chính mình" });
    }

    // Check if user exists
    const [users] = await pool.query("SELECT id FROM users WHERE id = ? AND locked = 0", [followingId]);
    if (!users.length) {
      return res.status(404).json({ msg: "Không tìm thấy người dùng" });
    }

    // Check if already following
    const [exist] = await pool.query(
      "SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?",
      [followerId, followingId]
    );

    if (exist.length) {
      return res.json({ ok: true, following: true });
    }

    // Follow
    await pool.query(
      "INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)",
      [followerId, followingId]
    );

    res.json({ ok: true, following: true });
  } catch (e) {
    console.error("FOLLOW USER ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/users/:id/unfollow
 * Unfollow a user
 */
router.post("/:id/unfollow", auth, async (req, res) => {
  try {
    const followingId = Number(req.params.id);
    const followerId = req.user.uid;

    await pool.query(
      "DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?",
      [followerId, followingId]
    );

    res.json({ ok: true, following: false });
  } catch (e) {
    console.error("UNFOLLOW USER ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/users/:id/posts
 * Get user's posts
 */
router.get("/:id/posts", optionalAuth, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    // Default: return all posts for profile (for easy management / deleting).
    // You can still paginate by passing limit & offset explicitly.
    const limitRaw = req.query.limit;
    const offset = Number(req.query.offset) || 0;

    // If limit is not provided -> return a large number to effectively fetch all.
    // Hard cap to protect server.
    const limit = Math.min(
      Number(limitRaw === undefined ? 1000 : limitRaw) || 1000,
      1000
    );

    const [posts] = await pool.query(
      `
      SELECT
        p.id, p.user_id, p.type, p.content, p.rating, p.created_at,
        p.restaurant_id, p.visibility,
        u.name AS author_name,
        u.avatar_url AS author_avatar,
        r.name AS restaurant_name,
        r.area AS restaurant_area,
        (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comment_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.user_id = ? AND p.visibility = 'public'
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [userId, limit, offset]
    );

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

    // Check which posts are liked by current user
    let likedPostIds = new Set();
    if (req.user?.uid && ids.length) {
      const [likedRows] = await pool.query(
        `SELECT post_id FROM post_likes WHERE post_id IN (${ids.map(() => "?").join(",")}) AND user_id = ?`,
        [...ids, req.user.uid]
      );
      likedRows.forEach((row) => likedPostIds.add(row.post_id));
    }

    res.json(
      posts.map((p) => ({
        ...p,
        media: mediaByPost.get(p.id) || [],
        is_liked: likedPostIds.has(p.id),
      }))
    );
  } catch (e) {
    console.error("GET USER POSTS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/users/:id/eating-plans
 * Get user's eating plans
 */
router.get("/:id/eating-plans", optionalAuth, async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const [plans] = await pool.query(
      `
      SELECT
        ep.id, ep.user_id, ep.title, ep.description, ep.restaurant_id,
        ep.restaurant_name, ep.planned_at, ep.max_participants, 
        ep.status, ep.created_at,
        u.name AS creator_name,
        (SELECT COUNT(*) FROM eating_plan_participants epp 
         WHERE epp.eating_plan_id = ep.id AND epp.status = 'confirmed') AS participant_count
      FROM eating_plans ep
      JOIN users u ON u.id = ep.user_id
      WHERE ep.user_id = ?
      ORDER BY ep.planned_at DESC
      `,
      [userId]
    );

    res.json(plans);
  } catch (e) {
    console.error("GET USER EATING PLANS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/users/:userId/follow (toggle follow)
 */
router.post("/:userId/follow", auth, async (req, res) => {
  try {
    const targetUserId = Number(req.params.userId);
    const currentUserId = req.user.uid;

    // Can't follow yourself
    if (targetUserId === currentUserId) {
      return res.status(400).json({ msg: "Không thể theo dõi chính mình" });
    }

    // Check if target user exists
    const [targetUser] = await pool.query(
      "SELECT id FROM users WHERE id = ? AND status = 'active' LIMIT 1",
      [targetUserId]
    );

    if (targetUser.length === 0) {
      return res.status(404).json({ msg: "Người dùng không tồn tại" });
    }

    // Check if already following
    const [existing] = await pool.query(
      "SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?",
      [currentUserId, targetUserId]
    );

    if (existing.length > 0) {
      // Unfollow
      await pool.query(
        "DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?",
        [currentUserId, targetUserId]
      );
      return res.json({ following: false });
    } else {
      // Follow
      await pool.query(
        "INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)",
        [currentUserId, targetUserId]
      );

      // Create notification for the followed user (async, don't wait)
      createFollowNotification(targetUserId, currentUserId).catch(console.error);

      return res.json({ following: true });
    }
  } catch (e) {
    console.error("FOLLOW ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/users/:userId/followers
 */
router.get("/:userId/followers", optionalAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const [followers] = await pool.query(`
      SELECT
        u.id, u.name, u.avatar_url, u.bio,
        uf.created_at as followed_at
      FROM user_follows uf
      JOIN users u ON u.id = uf.follower_id
      WHERE uf.following_id = ?
      ORDER BY uf.created_at DESC
    `, [userId]);

    res.json(followers);
  } catch (e) {
    console.error("GET FOLLOWERS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/users/:userId/following
 */
router.get("/:userId/following", optionalAuth, async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const [following] = await pool.query(`
      SELECT
        u.id, u.name, u.avatar_url, u.bio,
        uf.created_at as followed_at
      FROM user_follows uf
      JOIN users u ON u.id = uf.following_id
      WHERE uf.follower_id = ?
      ORDER BY uf.created_at DESC
    `, [userId]);

    res.json(following);
  } catch (e) {
    console.error("GET FOLLOWING ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/users/:userId/follow-status
 */
router.get("/:userId/follow-status", auth, async (req, res) => {
  try {
    const targetUserId = Number(req.params.userId);
    const currentUserId = req.user.uid;

    if (targetUserId === currentUserId) {
      return res.json({ isFollowing: false, canFollow: false });
    }

    const [result] = await pool.query(
      "SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = ?",
      [currentUserId, targetUserId]
    );

    res.json({
      isFollowing: result.length > 0,
      canFollow: true
    });
  } catch (e) {
    console.error("GET FOLLOW STATUS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
