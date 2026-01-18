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
        id, name, area, type, price_range, image_url, address,
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
      // Sort by rating first, then by distance
      query += ` ORDER BY 
        (CASE WHEN avg_rating IS NOT NULL THEN avg_rating ELSE 0 END) DESC,
        review_count DESC,
        name ASC
      `;
    } else if (sort === "distance" && !isNaN(lat) && !isNaN(lng)) {
      // Calculate distance in ORDER BY (MySQL 5.7+)
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

    // Calculate distance if lat/lng provided
    let results = rows;
    if (!isNaN(lat) && !isNaN(lng)) {
      results = rows.map((r) => {
        if (r.latitude && r.longitude) {
          r.distance = calculateDistance(lat, lng, r.latitude, r.longitude);
          r.distance_km = Math.round(r.distance * 10) / 10;
        }
        return r;
      });

      // Sort by distance if sort is distance (already done in SQL but ensure consistency)
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
        id, name, area, type, price_range, image_url, address,
        meal_time, latitude, longitude, avg_rating, review_count, is_featured,
        created_at
      FROM restaurants 
      WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    res.json(rows[0]);
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
    // Table might not exist yet, return empty array
    if (e.code === "ER_NO_SUCH_TABLE") {
      return res.json([]);
    }
    res.status(500).json({ msg: "Server error" });
  }
});

// POST /api/restaurants/:id/reviews
router.post("/:id/reviews", auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ msg: "Invalid restaurant ID" });

    const { rating, comment } = req.body;
    const userId = req.user.uid;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    // Check if restaurant exists
    const [restaurantRows] = await pool.query("SELECT id FROM restaurants WHERE id = ?", [id]);
    if (restaurantRows.length === 0) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    // Insert or update review (ON DUPLICATE KEY UPDATE)
    await pool.query(
      `INSERT INTO restaurant_reviews (restaurant_id, user_id, rating, comment)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       rating = VALUES(rating),
       comment = VALUES(comment),
       updated_at = CURRENT_TIMESTAMP`,
      [id, userId, rating, comment || null]
    );

    // Recalculate avg_rating and review_count
    const [stats] = await pool.query(
      `SELECT 
        AVG(rating) AS avg_rating,
        COUNT(*) AS review_count
      FROM restaurant_reviews
      WHERE restaurant_id = ?`,
      [id]
    );

    const avgRating = stats[0].avg_rating ? parseFloat(stats[0].avg_rating).toFixed(2) : null;
    const reviewCount = stats[0].review_count || 0;

    await pool.query(
      `UPDATE restaurants 
       SET avg_rating = ?, review_count = ?
       WHERE id = ?`,
      [avgRating, reviewCount, id]
    );

    res.json({ ok: true, avg_rating: avgRating, review_count: reviewCount });
  } catch (e) {
    console.error("CREATE REVIEW ERROR:", e);
    if (e.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ msg: "Reviews feature not available yet. Please run migration." });
    }
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE /api/restaurants/:id/reviews/:reviewId
router.delete("/:id/reviews/:reviewId", auth, async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id);
    const reviewId = parseInt(req.params.reviewId);
    const userId = req.user.uid;

    if (isNaN(restaurantId) || isNaN(reviewId)) {
      return res.status(400).json({ msg: "Invalid IDs" });
    }

    // Check if user owns the review or is admin
    const [reviewRows] = await pool.query(
      "SELECT user_id FROM restaurant_reviews WHERE id = ? AND restaurant_id = ?",
      [reviewId, restaurantId]
    );

    if (reviewRows.length === 0) {
      return res.status(404).json({ msg: "Review not found" });
    }

    const isOwner = reviewRows[0].user_id === userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ msg: "Permission denied" });
    }

    await pool.query(
      "DELETE FROM restaurant_reviews WHERE id = ?",
      [reviewId]
    );

    // Recalculate stats
    const [stats] = await pool.query(
      `SELECT 
        AVG(rating) AS avg_rating,
        COUNT(*) AS review_count
      FROM restaurant_reviews
      WHERE restaurant_id = ?`,
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
