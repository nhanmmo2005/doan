const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get notifications for current user
// Mounted at /api/notifications in server/index.js so use root paths here
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get notifications for user, ordered by newest first
    const [notifications] = await pool.execute(`
      SELECT
        id,
        type,
        title,
        content,
        related_id,
        related_type,
        actor_name,
        is_read,
        created_at,
        TIMESTAMPDIFF(MINUTE, created_at, NOW()) as minutes_ago
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);

    // Format time ago
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      time_ago: formatTimeAgo(notification.minutes_ago)
    }));

    res.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.uid;

    const [result] = await pool.execute(`
      UPDATE notifications
      SET is_read = 1, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [notificationId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user.uid;

    await pool.execute(`
      UPDATE notifications
      SET is_read = 1, updated_at = NOW()
      WHERE user_id = ? AND is_read = 0
    `, [userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Get unread count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.uid;

    const [result] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND is_read = 0
    `, [userId]);

    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Resolve a notification to a navigable URL (returns { url: string | null })
router.get('/:id/resolve', auth, async (req, res) => {
  try {
    const nid = Number(req.params.id);
    const userId = req.user.uid;

    const [rows] = await pool.execute(
      `SELECT related_id, related_type FROM notifications WHERE id = ? AND user_id = ? LIMIT 1`,
      [nid, userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const { related_id: relatedId, related_type: relatedType } = rows[0];
    let url = null;

    if (relatedType === 'post' && relatedId) {
      url = `/posts/${relatedId}`;
    } else if (relatedType === 'comment' && relatedId) {
      // find parent post id for the comment
      const [crows] = await pool.execute(`SELECT post_id FROM post_comments WHERE id = ? LIMIT 1`, [relatedId]);
      if (crows.length) url = `/posts/${crows[0].post_id}#comment-${relatedId}`;
    } else if (relatedType === 'user' && relatedId) {
      url = `/users/${relatedId}`;
    } else if (relatedType === 'restaurant' && relatedId) {
      url = `/restaurants/${relatedId}`;
    }

    res.json({ url });
  } catch (error) {
    console.error('Error resolving notification url:', error);
    res.status(500).json({ error: 'Failed to resolve' });
  }
});

// Helper function to format time ago
function formatTimeAgo(minutes) {
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} tuần trước`;

  const months = Math.floor(days / 30);
  return `${months} tháng trước`;
}

module.exports = router;
