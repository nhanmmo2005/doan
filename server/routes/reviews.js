const express = require("express");
const pool = require("../db");
const router = express.Router();
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const adminOnly = require("../middleware/adminOnly");
const filterText = require("../utils/filterText");

// ============================================================
// GET REVIEWS
// ============================================================

/**
 * GET /api/reviews
 * Lấy danh sách reviews đã được duyệt
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { restaurant_id, user_id, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT 
        rr.id, rr.restaurant_id, rr.user_id, rr.rating, rr.price_rating, rr.food_rating, rr.hygiene_rating,
        rr.comment, rr.status, rr.created_at, rr.updated_at,
        u.name AS author_name, u.avatar_url AS author_avatar,
        r.name AS restaurant_name,
        COALESCE((SELECT COUNT(*) FROM review_comments WHERE review_id = rr.id), 0) AS comment_count
      FROM restaurant_reviews rr
      JOIN users u ON u.id = rr.user_id
      LEFT JOIN restaurants r ON r.id = rr.restaurant_id
      WHERE rr.status = 'approved'
    `;
    const params = [];

    if (restaurant_id) {
      query += " AND rr.restaurant_id = ?";
      params.push(Number(restaurant_id));
    }
    if (user_id) {
      query += " AND rr.user_id = ?";
      params.push(Number(user_id));
    }

    query += " ORDER BY rr.created_at DESC LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    const [reviews] = await pool.query(query, params);

    // Load media for each review (if table exists)
    const reviewIds = reviews.map((r) => r.id);
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

        reviews.forEach((review) => {
          review.media = mediaMap[review.id] || [];
        });
      } catch (e) {
        // Table might not exist yet, just skip media
        console.warn("review_media table might not exist:", e.message);
        reviews.forEach((review) => {
          review.media = [];
        });
      }
    }

    res.json(reviews);
  } catch (e) {
    console.error("GET REVIEWS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/reviews/:id
 * Lấy chi tiết review
 */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const reviewId = Number(req.params.id);
    const [reviews] = await pool.query(
      `SELECT 
        rr.id, rr.restaurant_id, rr.user_id, rr.rating, rr.price_rating, rr.food_rating, rr.hygiene_rating,
        rr.comment, rr.status, rr.created_at, rr.updated_at,
        u.name AS author_name, u.avatar_url AS author_avatar,
        r.name AS restaurant_name
      FROM restaurant_reviews rr
      JOIN users u ON u.id = rr.user_id
      LEFT JOIN restaurants r ON r.id = rr.restaurant_id
      WHERE rr.id = ? AND rr.status = 'approved'`,
      [reviewId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ msg: "Review not found" });
    }

    const review = reviews[0];

    // Load media
    const [mediaRows] = await pool.query(
      `SELECT media_type, url, sort_order 
       FROM review_media 
       WHERE review_id = ? 
       ORDER BY sort_order`,
      [reviewId]
    );
    review.media = mediaRows.map((m) => ({
      type: m.media_type,
      url: m.url,
      sortOrder: m.sort_order,
    }));

    res.json(review);
  } catch (e) {
    console.error("GET REVIEW ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// CREATE REVIEW
// ============================================================

/**
 * POST /api/reviews
 * Tạo review mới (status = pending, cần admin duyệt)
 */
router.post("/", auth, async (req, res) => {
  try {
    const { restaurant_id, price_rating, food_rating, hygiene_rating, comment, media } = req.body;
    const userId = req.user.uid;

    if (!restaurant_id) {
      return res.status(400).json({ msg: "Bạn chưa chọn quán ăn" });
    }

    // Validate 3 tiêu chí
    if (!price_rating || price_rating < 1 || price_rating > 5) {
      return res.status(400).json({ msg: "Đánh giá Giá cả phải từ 1 đến 5" });
    }
    if (!food_rating || food_rating < 1 || food_rating > 5) {
      return res.status(400).json({ msg: "Đánh giá Thức ăn ngon phải từ 1 đến 5" });
    }
    if (!hygiene_rating || hygiene_rating < 1 || hygiene_rating > 5) {
      return res.status(400).json({ msg: "Đánh giá Vệ sinh thực phẩm phải từ 1 đến 5" });
    }

    // Tính trung bình
    const rating = Math.round((price_rating + food_rating + hygiene_rating) / 3);

    // Check if restaurant exists
    const [restaurantRows] = await pool.query("SELECT id FROM restaurants WHERE id = ?", [restaurant_id]);
    if (restaurantRows.length === 0) {
      return res.status(404).json({ msg: "Quán ăn không tồn tại" });
    }

    // Check if user already reviewed (only one review per user per restaurant)
    const [existing] = await pool.query(
      "SELECT id FROM restaurant_reviews WHERE restaurant_id = ? AND user_id = ?",
      [restaurant_id, userId]
    );

    let reviewId;
    if (existing.length > 0) {
      // Update existing review
      reviewId = existing[0].id;
      await pool.query(
        `UPDATE restaurant_reviews 
         SET rating = ?, price_rating = ?, food_rating = ?, hygiene_rating = ?, comment = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [rating, price_rating, food_rating, hygiene_rating, comment ? filterText(comment.trim()) : null, reviewId]
      );

      // Delete old media
      try {
        await pool.query("DELETE FROM review_media WHERE review_id = ?", [reviewId]);
      } catch (e) {
        console.warn("review_media table might not exist:", e.message);
      }
    } else {
      // Create new review
      const [ins] = await pool.query(
        `INSERT INTO restaurant_reviews (restaurant_id, user_id, rating, price_rating, food_rating, hygiene_rating, comment, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [restaurant_id, userId, rating, price_rating, food_rating, hygiene_rating, comment ? filterText(comment.trim()) : null]
      );
      reviewId = ins.insertId;
    }

    // Insert media (if table exists)
    if (Array.isArray(media) && media.length > 0) {
      try {
        const mediaRows = media
          .filter((m) => m && m.url && (m.type === "image" || m.type === "video"))
          .map((m, idx) => [reviewId, m.type, m.url, Number(m.sortOrder ?? idx)]);

        if (mediaRows.length > 0) {
          await pool.query(
            `INSERT INTO review_media (review_id, media_type, url, sort_order) VALUES ?`,
            [mediaRows]
          );
        }
      } catch (e) {
        // Table might not exist yet, just log warning
        console.warn("review_media table might not exist, skipping media insert:", e.message);
      }
    }

    res.json({ ok: true, id: reviewId, message: "Review đã được gửi, đang chờ duyệt" });
  } catch (e) {
    console.error("CREATE REVIEW ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

// ============================================================
// REVIEW COMMENTS
// ============================================================

/**
 * GET /api/reviews/:id/comments
 * Lấy comments của review
 */
router.get("/:id/comments", optionalAuth, async (req, res) => {
  try {
    const reviewId = Number(req.params.id);
    
    // Check if table exists
    try {
      const [comments] = await pool.query(
        `SELECT 
          rc.id, rc.review_id, rc.user_id, rc.parent_id, rc.content, rc.created_at,
          u.name AS author_name, u.avatar_url AS author_avatar
        FROM review_comments rc
        JOIN users u ON u.id = rc.user_id
        WHERE rc.review_id = ?
        ORDER BY rc.created_at ASC`,
        [reviewId]
      );

      // Build tree structure
      function buildTree(items, parentId = null) {
        return items
          .filter((item) => {
            if (parentId === null) {
              return item.parent_id === null;
            }
            return item.parent_id === parentId;
          })
          .map((item) => ({
            ...item,
            replies: buildTree(items, item.id),
          }));
      }

      const tree = buildTree(comments);
      res.json(tree);
    } catch (tableError) {
      // Table might not exist yet
      if (tableError.code === "ER_NO_SUCH_TABLE") {
        return res.json([]);
      }
      throw tableError;
    }
  } catch (e) {
    console.error("GET REVIEW COMMENTS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/reviews/:id/comments
 * Tạo comment cho review
 */
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const reviewId = Number(req.params.id);
    const { content, parent_id } = req.body;
    const userId = req.user.uid;

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: "Bạn chưa nhập nội dung" });
    }

    // Check if review exists and is approved
    const [reviews] = await pool.query(
      "SELECT id FROM restaurant_reviews WHERE id = ? AND status = 'approved'",
      [reviewId]
    );
    if (reviews.length === 0) {
      return res.status(404).json({ msg: "Review không tồn tại hoặc chưa được duyệt" });
    }

    // Check parent comment if exists
    if (parent_id) {
      const [parents] = await pool.query(
        "SELECT id FROM review_comments WHERE id = ? AND review_id = ?",
        [parent_id, reviewId]
      );
      if (parents.length === 0) {
        return res.status(400).json({ msg: "Comment cha không tồn tại" });
      }
    }

    const safeContent = filterText(content.trim());
    const [ins] = await pool.query(
      `INSERT INTO review_comments (review_id, user_id, parent_id, content)
       VALUES (?, ?, ?, ?)`,
      [reviewId, userId, parent_id || null, safeContent]
    );

    res.json({ ok: true, id: ins.insertId });
  } catch (e) {
    console.error("CREATE REVIEW COMMENT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/reviews/:id/comments/:commentId
 * Xóa comment
 */
router.delete("/:id/comments/:commentId", auth, async (req, res) => {
  try {
    const reviewId = Number(req.params.id);
    const commentId = Number(req.params.commentId);
    const userId = req.user.uid;

    // Check ownership or admin
    const [comments] = await pool.query(
      "SELECT user_id FROM review_comments WHERE id = ? AND review_id = ?",
      [commentId, reviewId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ msg: "Comment không tồn tại" });
    }

    const isOwner = comments[0].user_id === userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: "Không có quyền xóa comment này" });
    }

    await pool.query("DELETE FROM review_comments WHERE id = ?", [commentId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE REVIEW COMMENT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/reviews/:id
 * Xóa review (user có thể xóa review của mình)
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const reviewId = Number(req.params.id);
    const userId = req.user.uid;

    // Check ownership or admin
    const [reviews] = await pool.query(
      "SELECT user_id, restaurant_id FROM restaurant_reviews WHERE id = ?",
      [reviewId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ msg: "Review không tồn tại" });
    }

    const isOwner = reviews[0].user_id === userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: "Không có quyền xóa review này" });
    }

    const restaurantId = reviews[0].restaurant_id;

    await pool.query("DELETE FROM restaurant_reviews WHERE id = ?", [reviewId]);

    // Recalculate stats
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

    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE REVIEW ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
