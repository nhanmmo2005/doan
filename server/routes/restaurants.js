const express = require("express");
const pool = require("../db");
const router = express.Router();
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");

// Haversine formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// GET /api/restaurants?search=&area=&type=&price_range=&meal_time=&sort=&lat=&lng=
router.get("/", optionalAuth, async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const area = (req.query.area || "").trim();
    const type = (req.query.type || "").trim();
    const priceRange = (req.query.price_range || "").trim();
    const mealTime = (req.query.meal_time || "").trim();
    const sort = (req.query.sort || "name").trim(); // name, rating, distance
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    let query = `
      SELECT 
        id, name, area, type, price_range, image_url, address, description,
        meal_time, latitude, longitude, avg_rating, review_count, is_featured
      FROM restaurants 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += " AND (name LIKE ? OR address LIKE ?)";
      const like = `%${search}%`;
      params.push(like, like);
    }

    if (area) {
      query += " AND area LIKE ?";
      params.push(`%${area}%`);
    }

    if (type) {
      query += " AND type LIKE ?";
      params.push(`%${type}%`);
    }

    if (priceRange) {
      query += " AND price_range LIKE ?";
      params.push(`%${priceRange}%`);
    }

    if (mealTime && mealTime !== "all") {
      query += " AND (meal_time = ? OR meal_time = 'all')";
      params.push(mealTime);
    }

    // Order by
    if (sort === "rating" && !isNaN(lat) && !isNaN(lng)) {
      query += ` ORDER BY 
        (CASE WHEN avg_rating IS NOT NULL THEN avg_rating ELSE 0 END) DESC,
        review_count DESC,
        name ASC
      `;
    } else if (sort === "distance" && !isNaN(lat) && !isNaN(lng)) {
      query += ` ORDER BY 
        (6371 * acos(
          cos(radians(?)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(?)) +
          sin(radians(?)) * sin(radians(latitude))
        )) ASC,
        name ASC
      `;
      params.push(lat, lng, lat);
    } else {
      query += " ORDER BY is_featured DESC, name ASC";
    }

    query += " LIMIT 200";

    const [rows] = await pool.query(query, params);

    let results = rows;
    if (!isNaN(lat) && !isNaN(lng)) {
      results = rows.map((r) => {
        if (r.latitude && r.longitude) {
          r.distance = calculateDistance(lat, lng, r.latitude, r.longitude);
          r.distance_km = Math.round(r.distance * 10) / 10;
        }
        return r;
      });

      if (sort === "distance") {
        results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      }
    }

    res.json(results);
  } catch (e) {
    console.error("RESTAURANTS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/restaurants/:id
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ msg: "Invalid restaurant ID" });

    const [rows] = await pool.query(
      `SELECT 
        id, name, area, type, price_range, image_url, address, description,
        meal_time, latitude, longitude, avg_rating, review_count, is_featured,
        created_at
      FROM restaurants 
      WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    const restaurant = rows[0];

    const [media] = await pool.query(
      `SELECT id, media_type, url, sort_order 
       FROM restaurant_media 
       WHERE restaurant_id = ? 
       ORDER BY sort_order ASC`,
      [id]
    );

    res.json({
      ...restaurant,
      media: media || []
    });
  } catch (e) {
    console.error("RESTAURANT DETAIL ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/restaurants/:id/reviews
router.get("/:id/reviews", optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ msg: "Invalid restaurant ID" });

    const [rows] = await pool.query(
      `SELECT 
        rr.id, rr.restaurant_id, rr.user_id, rr.rating, rr.comment,
        rr.created_at, rr.updated_at,
        u.name AS author_name, u.avatar_url AS author_avatar
      FROM restaurant_reviews rr
      JOIN users u ON u.id = rr.user_id
      WHERE rr.restaurant_id = ?
      ORDER BY rr.created_at DESC
      LIMIT 100`,
      [id]
    );

    res.json(rows);
  } catch (e) {
    console.error("RESTAURANT REVIEWS ERROR:", e);
    if (e.code === "ER_NO_SUCH_TABLE") {
      return res.json([]);
    }
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/restaurants/:id/comments
router.get("/:id/comments", optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ msg: "Invalid restaurant ID" });

    const [rows] = await pool.query(
      `SELECT 
        rc.id, rc.restaurant_id, rc.user_id, rc.parent_id, rc.content,
        rc.created_at, rc.updated_at,
        u.name AS author_name, u.avatar_url AS author_avatar
      FROM restaurant_comments rc
      JOIN users u ON u.id = rc.user_id
      WHERE rc.restaurant_id = ?
      ORDER BY rc.created_at ASC`,
      [id]
    );

    res.json(rows);
  } catch (e) {
    console.error("RESTAURANT COMMENTS ERROR:", e);
    if (e.code === "ER_NO_SUCH_TABLE") return res.json([]);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST /api/restaurants/:id/comments
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content, parentId } = req.body;
    const userId = req.user.uid;

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: "Nội dung không được để trống" });
    }

    await pool.query(
      `INSERT INTO restaurant_comments (restaurant_id, user_id, parent_id, content)
       VALUES (?, ?, ?, ?)`,
      [id, userId, parentId || null, content.trim()]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("CREATE RESTAURANT COMMENT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE /api/restaurants/:id/comments/:commentId
router.delete("/:id/comments/:commentId", auth, async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const userId = req.user.uid;

    const [rows] = await pool.query(
      "SELECT user_id FROM restaurant_comments WHERE id = ?",
      [commentId]
    );

    if (rows.length === 0) return res.status(404).json({ msg: "Comment not found" });

    const isOwner = rows[0].user_id === userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: "Permission denied" });
    }

    await pool.query("DELETE FROM restaurant_comments WHERE id = ?", [commentId]);
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE RESTAURANT COMMENT ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
