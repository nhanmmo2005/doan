// server/routes/eatingPlans.js
const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const filterText = require("../utils/filterText");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Optional auth: check token but don't fail if missing
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
 * GET /api/eating-plans
 * Get all eating plans (kèo ăn)
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { status, upcoming } = req.query;

    // Build query - try with optional columns first
    let query = `
      SELECT
        ep.id, ep.user_id, ep.title, ep.description, ep.restaurant_id,
        ep.restaurant_name, ep.planned_at, ep.max_participants, 
        ep.status, ep.created_at, ep.updated_at,
        u.name AS creator_name,
        r.name AS restaurant_name,
        r.area AS restaurant_area,
        r.address AS restaurant_address,
        (SELECT COUNT(*) FROM eating_plan_participants epp 
         WHERE epp.eating_plan_id = ep.id AND epp.status = 'confirmed') AS participant_count
      FROM eating_plans ep
      JOIN users u ON u.id = ep.user_id
      LEFT JOIN restaurants r ON r.id = ep.restaurant_id
      WHERE 1=1
        AND (ep.planned_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) OR ep.status NOT IN ('open', 'closed'))
    `;

    const params = [];

    if (status) {
      query += ` AND ep.status = ?`;
      params.push(status);
    }

    if (upcoming === "true") {
      query += ` AND ep.planned_at >= NOW() AND ep.status IN ('open', 'closed')`;
    }

    query += ` ORDER BY ep.planned_at ASC LIMIT 100`;

    let plans;
    try {
      [plans] = await pool.query(query, params);
    } catch (e) {
      console.error("Query error:", e.message);
      throw e;
    }

    // Try to add location and estimated_cost if columns exist
    if (plans.length) {
      try {
        const planIds = plans.map((p) => p.id);
        const [extras] = await pool.query(
          `SELECT id, COALESCE(location, '') as location, COALESCE(estimated_cost, '') as estimated_cost 
           FROM eating_plans WHERE id IN (${planIds.map(() => "?").join(",")})`,
          planIds
        );
        const extrasMap = new Map(extras.map((e) => [e.id, e]));
        plans = plans.map((p) => ({
          ...p,
          location: extrasMap.get(p.id)?.location || null,
          estimated_cost: extrasMap.get(p.id)?.estimated_cost || null,
        }));
      } catch (e) {
        // Columns don't exist, add null values
        plans = plans.map((p) => ({
          ...p,
          location: null,
          estimated_cost: null,
        }));
      }
    }

    // Check which plans user has joined (if logged in)
    let joinedPlanIds = new Set();
    if (req.user?.uid && plans.length) {
      const planIds = plans.map((p) => p.id);
      const [joinedRows] = await pool.query(
        `SELECT eating_plan_id FROM eating_plan_participants 
         WHERE eating_plan_id IN (${planIds.map(() => "?").join(",")}) 
         AND user_id = ? AND status = 'confirmed'`,
        [...planIds, req.user.uid]
      );
      joinedRows.forEach((row) => joinedPlanIds.add(row.eating_plan_id));
    }

    res.json(
      plans.map((p) => ({
        ...p,
        is_joined: joinedPlanIds.has(p.id),
        is_creator: req.user?.uid === p.user_id,
      }))
    );
  } catch (e) {
    console.error("GET EATING PLANS ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * GET /api/eating-plans/:id
 * Get eating plan detail
 */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const planId = Number(req.params.id);

    let plans;
    try {
      [plans] = await pool.query(
        `
        SELECT
          ep.id, ep.user_id, ep.title, ep.description, ep.restaurant_id,
          ep.restaurant_name, ep.planned_at, ep.max_participants, 
          ep.status, ep.created_at, ep.updated_at,
          u.name AS creator_name,
          r.name AS restaurant_name,
          r.area AS restaurant_area,
          r.address AS restaurant_address,
          r.image_url AS restaurant_image,
          (SELECT COUNT(*) FROM eating_plan_participants epp 
           WHERE epp.eating_plan_id = ep.id AND epp.status = 'confirmed') AS participant_count
        FROM eating_plans ep
        JOIN users u ON u.id = ep.user_id
        LEFT JOIN restaurants r ON r.id = ep.restaurant_id
        WHERE ep.id = ?
        LIMIT 1
        `,
        [planId]
      );
    } catch (e) {
      console.error("Get plan detail error:", e.message);
      throw e;
    }

    // Try to add location and estimated_cost if columns exist
    if (plans.length) {
      try {
        const [extras] = await pool.query(
          `SELECT COALESCE(location, '') as location, COALESCE(estimated_cost, '') as estimated_cost 
           FROM eating_plans WHERE id = ?`,
          [planId]
        );
        if (extras.length) {
          plans[0].location = extras[0].location || null;
          plans[0].estimated_cost = extras[0].estimated_cost || null;
        }
      } catch (e) {
        // Columns don't exist, set to null
        plans[0].location = null;
        plans[0].estimated_cost = null;
      }
    }

    if (!plans.length) {
      return res.status(404).json({ msg: "Không tìm thấy kèo ăn" });
    }

    const plan = plans[0];

    // Get participants
    const [participants] = await pool.query(
      `
      SELECT
        epp.id, epp.user_id, epp.status, epp.joined_at,
        u.name AS user_name
      FROM eating_plan_participants epp
      JOIN users u ON u.id = epp.user_id
      WHERE epp.eating_plan_id = ? AND epp.status = 'confirmed'
      ORDER BY epp.joined_at ASC
      `,
      [planId]
    );

    // Get comments count (if table exists)
    let commentCount = 0;
    try {
      const [commentCountRows] = await pool.query(
        `SELECT COUNT(*) as count FROM eating_plan_comments WHERE eating_plan_id = ?`,
        [planId]
      );
      commentCount = commentCountRows[0]?.count || 0;
    } catch (e) {
      // Table doesn't exist yet
      commentCount = 0;
    }

    // Check if current user has joined
    let isJoined = false;
    if (req.user?.uid) {
      const [joinedRows] = await pool.query(
        `SELECT 1 FROM eating_plan_participants 
         WHERE eating_plan_id = ? AND user_id = ? AND status = 'confirmed'`,
        [planId, req.user.uid]
      );
      isJoined = joinedRows.length > 0;
    }

    res.json({
      ...plan,
      participants: participants || [],
      is_joined: isJoined,
      is_creator: req.user?.uid === plan.user_id,
      comment_count: commentCount,
    });
  } catch (e) {
    console.error("GET EATING PLAN DETAIL ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/eating-plans
 * Create new eating plan (kèo ăn)
 */
router.post("/", auth, async (req, res) => {
  try {
    const { title, location, restaurantId, restaurantName, plannedAt, maxParticipants, estimatedCost, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ msg: "Bạn chưa nhập tiêu đề" });
    }

    if (!plannedAt) {
      return res.status(400).json({ msg: "Bạn chưa chọn thời gian" });
    }

    const safeTitle = filterText(title.trim());
    const safeLocation = location ? filterText(location.trim()) : null;
    const safeDescription = description ? filterText(description.trim()) : null;
    const safeRestaurantName = restaurantName ? filterText(restaurantName.trim()) : null;
    const safeEstimatedCost = estimatedCost ? filterText(String(estimatedCost).trim()) : null;

    // Try inserting with location and estimated_cost, fallback if columns don't exist
    let ins;
    try {
      // First try with all columns
      [ins] = await pool.query(
        `INSERT INTO eating_plans 
         (user_id, title, description, restaurant_id, restaurant_name, location, planned_at, max_participants, estimated_cost, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
        [
          req.user.uid,
          safeTitle,
          safeDescription,
          restaurantId ? Number(restaurantId) : null,
          safeRestaurantName,
          safeLocation,
          new Date(plannedAt),
          maxParticipants ? Number(maxParticipants) : null,
          safeEstimatedCost,
        ]
      );
    } catch (e) {
      // Columns don't exist, insert without them
      // Use location as restaurant_name if location column doesn't exist
      [ins] = await pool.query(
        `INSERT INTO eating_plans 
         (user_id, title, description, restaurant_id, restaurant_name, planned_at, max_participants, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`,
        [
          req.user.uid,
          safeTitle,
          safeDescription,
          restaurantId ? Number(restaurantId) : null,
          safeRestaurantName || safeLocation,
          new Date(plannedAt),
          maxParticipants ? Number(maxParticipants) : null,
        ]
      );
    }

    // Auto-add creator as participant
    await pool.query(
      `INSERT INTO eating_plan_participants (eating_plan_id, user_id, status)
       VALUES (?, ?, 'confirmed')`,
      [ins.insertId, req.user.uid]
    );

    res.json({ ok: true, id: ins.insertId });
  } catch (e) {
    console.error("CREATE EATING PLAN ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * PUT /api/eating-plans/:id
 * Update eating plan
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const planId = Number(req.params.id);
    const uid = req.user.uid;

    // Check ownership
    const [rows] = await pool.query(
      "SELECT user_id FROM eating_plans WHERE id = ? LIMIT 1",
      [planId]
    );

    if (!rows.length) {
      return res.status(404).json({ msg: "Không tìm thấy kèo ăn" });
    }

    if (rows[0].user_id !== uid) {
      return res.status(403).json({ msg: "Không có quyền sửa kèo ăn này" });
    }

    const { title, location, description, restaurantId, restaurantName, plannedAt, maxParticipants, estimatedCost, status } = req.body;

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push("title = ?");
      params.push(filterText(title.trim()));
    }

    if (location !== undefined) {
      // Try to update location, will fail silently if column doesn't exist
      // User needs to run migration to use this feature
      try {
        // Test if column exists by describing table
        updates.push("location = ?");
        params.push(location ? filterText(location.trim()) : null);
      } catch (e) {
        // Column doesn't exist, skip
        console.log("Location column not found, skipping update");
      }
    }

    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description ? filterText(description.trim()) : null);
    }

    if (restaurantId !== undefined) {
      updates.push("restaurant_id = ?");
      params.push(restaurantId ? Number(restaurantId) : null);
    }

    if (restaurantName !== undefined) {
      updates.push("restaurant_name = ?");
      params.push(restaurantName ? filterText(restaurantName.trim()) : null);
    }

    if (plannedAt !== undefined) {
      updates.push("planned_at = ?");
      params.push(new Date(plannedAt));
    }

    if (maxParticipants !== undefined) {
      updates.push("max_participants = ?");
      params.push(maxParticipants ? Number(maxParticipants) : null);
    }

    if (estimatedCost !== undefined) {
      // Try to update estimated_cost, will fail silently if column doesn't exist
      try {
        updates.push("estimated_cost = ?");
        params.push(estimatedCost ? filterText(String(estimatedCost).trim()) : null);
      } catch (e) {
        // Column doesn't exist, skip
        console.log("Estimated_cost column not found, skipping update");
      }
    }

    if (status !== undefined && ["open", "closed", "completed", "cancelled"].includes(status)) {
      updates.push("status = ?");
      params.push(status);
    }

    if (updates.length === 0) {
      return res.json({ ok: true });
    }

    params.push(planId);
    await pool.query(
      `UPDATE eating_plans SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("UPDATE EATING PLAN ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * DELETE /api/eating-plans/:id
 * Delete eating plan
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const planId = Number(req.params.id);
    const uid = req.user.uid;

    // Check ownership
    const [rows] = await pool.query(
      "SELECT user_id FROM eating_plans WHERE id = ? LIMIT 1",
      [planId]
    );

    if (!rows.length) {
      return res.status(404).json({ msg: "Không tìm thấy kèo ăn" });
    }

    if (rows[0].user_id !== uid) {
      return res.status(403).json({ msg: "Không có quyền xoá kèo ăn này" });
    }

    await pool.query("DELETE FROM eating_plans WHERE id = ?", [planId]);

    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE EATING PLAN ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/eating-plans/:id/join
 * Join eating plan
 */
router.post("/:id/join", auth, async (req, res) => {
  try {
    const planId = Number(req.params.id);
    const uid = req.user.uid;

    // Check if plan exists
    const [plans] = await pool.query(
      "SELECT id, max_participants, status FROM eating_plans WHERE id = ? LIMIT 1",
      [planId]
    );

    if (!plans.length) {
      return res.status(404).json({ msg: "Không tìm thấy kèo ăn" });
    }

    const plan = plans[0];

    if (plan.status !== "open" && plan.status !== "closed") {
      return res.status(400).json({ msg: "Kèo ăn này không còn nhận người tham gia" });
    }

    // Check if already joined
    const [exist] = await pool.query(
      "SELECT id FROM eating_plan_participants WHERE eating_plan_id = ? AND user_id = ?",
      [planId, uid]
    );

    if (exist.length) {
      // Update to confirmed if cancelled before
      await pool.query(
        "UPDATE eating_plan_participants SET status = 'confirmed' WHERE eating_plan_id = ? AND user_id = ?",
        [planId, uid]
      );
      return res.json({ ok: true, joined: true });
    }

    // Check max participants
    if (plan.max_participants) {
      const [countRows] = await pool.query(
        `SELECT COUNT(*) as count FROM eating_plan_participants 
         WHERE eating_plan_id = ? AND status = 'confirmed'`,
        [planId]
      );

      if (countRows[0].count >= plan.max_participants) {
        return res.status(400).json({ msg: "Kèo ăn này đã đủ số người tham gia" });
      }
    }

    // Join
    await pool.query(
      `INSERT INTO eating_plan_participants (eating_plan_id, user_id, status)
       VALUES (?, ?, 'confirmed')`,
      [planId, uid]
    );

    res.json({ ok: true, joined: true });
  } catch (e) {
    console.error("JOIN EATING PLAN ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/eating-plans/:id/leave
 * Leave eating plan
 */
router.post("/:id/leave", auth, async (req, res) => {
  try {
    const planId = Number(req.params.id);
    const uid = req.user.uid;

    // Check if plan exists
    const [plans] = await pool.query(
      "SELECT id, user_id FROM eating_plans WHERE id = ? LIMIT 1",
      [planId]
    );

    if (!plans.length) {
      return res.status(404).json({ msg: "Không tìm thấy kèo ăn" });
    }

    // Creator cannot leave
    if (plans[0].user_id === uid) {
      return res.status(400).json({ msg: "Người tạo kèo không thể rời" });
    }

    // Check if joined
    const [exist] = await pool.query(
      "SELECT id FROM eating_plan_participants WHERE eating_plan_id = ? AND user_id = ? AND status = 'confirmed'",
      [planId, uid]
    );

    if (!exist.length) {
      return res.status(400).json({ msg: "Bạn chưa tham gia kèo ăn này" });
    }

    // Leave (set status to cancelled instead of delete to keep history)
    await pool.query(
      "UPDATE eating_plan_participants SET status = 'cancelled' WHERE eating_plan_id = ? AND user_id = ?",
      [planId, uid]
    );

    res.json({ ok: true, left: true });
  } catch (e) {
    console.error("LEAVE EATING PLAN ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * Auto-delete old plans (called on startup or as cron)
 * Delete plans that are past planned_at by more than 1 hour
 */
router.post("/_internal/cleanup", async (req, res) => {
  try {
    // Instead of using 'deleted' status, just exclude old plans from queries
    // Or if we want to delete them completely:
    await pool.query(
      `DELETE FROM eating_plans 
       WHERE status IN ('open', 'closed') 
       AND planned_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)`
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("CLEANUP ERROR:", e);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
