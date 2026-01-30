// server/utils/notifications.js
const pool = require('../db');

/**
 * Create a notification for a user
 * @param {Object} params
 * @param {number} params.userId - User who receives the notification
 * @param {string} params.type - Notification type: 'like', 'comment', 'follow', 'promotion', 'system'
 * @param {string} params.title - Notification title
 * @param {string} params.content - Notification content
 * @param {number} params.relatedId - ID of related item (post, comment, user)
 * @param {string} params.relatedType - Type of related item: 'post', 'comment', 'user'
 * @param {number} params.actorId - User who performed the action (optional)
 * @returns {Promise<number>} Notification ID
 */
async function createNotification({
  userId,
  type,
  title,
  content,
  relatedId = null,
  relatedType = null,
  actorId = null
}) {
  try {
    // Get actor name if actorId provided
    let actorName = null;
    if (actorId) {
      const [actorRows] = await pool.execute(
        'SELECT name FROM users WHERE id = ? LIMIT 1',
        [actorId]
      );
      if (actorRows.length > 0) {
        actorName = actorRows[0].name;
      }
    }

    const [result] = await pool.execute(`
      INSERT INTO notifications (
        user_id, type, title, content, related_id, related_type, actor_id, actor_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, type, title, content, relatedId, relatedType, actorId, actorName]);

    return result.insertId;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create like notification
 * @param {number} postId - Post that was liked
 * @param {number} likerId - User who liked the post
 */
async function createLikeNotification(postId, likerId) {
  try {
    // Get post owner
    const [postRows] = await pool.execute(
      'SELECT user_id FROM posts WHERE id = ? LIMIT 1',
      [postId]
    );

    if (postRows.length === 0) return;

    const postOwnerId = postRows[0].user_id;

    // Don't notify if user likes their own post
    if (postOwnerId === likerId) return;

    // Check if notification already exists and is unread
    const [existing] = await pool.execute(`
      SELECT id FROM notifications
      WHERE user_id = ? AND type = 'like' AND related_id = ? AND related_type = 'post'
      AND actor_id = ? AND is_read = 0
      LIMIT 1
    `, [postOwnerId, postId, likerId]);

    // Don't create duplicate unread notifications
    if (existing.length > 0) return;

    await createNotification({
      userId: postOwnerId,
      type: 'like',
      title: 'Đã thích bài viết',
      content: 'Bài viết của bạn đã được thích',
      relatedId: postId,
      relatedType: 'post',
      actorId: likerId
    });
  } catch (error) {
    console.error('Error creating like notification:', error);
  }
}

/**
 * Create comment notification
 * @param {number} postId - Post that was commented on
 * @param {number} commentId - Comment ID
 * @param {number} commenterId - User who commented
 * @param {string} commentContent - Comment content (truncated)
 */
async function createCommentNotification(postId, commentId, commenterId, commentContent) {
  try {
    // Get post owner
    const [postRows] = await pool.execute(
      'SELECT user_id FROM posts WHERE id = ? LIMIT 1',
      [postId]
    );

    if (postRows.length === 0) return;

    const postOwnerId = postRows[0].user_id;

    // Don't notify if user comments on their own post
    if (postOwnerId === commenterId) return;

    // Truncate comment content for notification
    const truncatedContent = commentContent.length > 50
      ? commentContent.substring(0, 50) + '...'
      : commentContent;

    await createNotification({
      userId: postOwnerId,
      type: 'comment',
      title: 'Bình luận mới',
      content: `Đã bình luận: "${truncatedContent}"`,
      relatedId: commentId,
      relatedType: 'comment',
      actorId: commenterId
    });
  } catch (error) {
    console.error('Error creating comment notification:', error);
  }
}

/**
 * Create follow notification
 * @param {number} followedUserId - User who is being followed
 * @param {number} followerId - User who is following
 */
async function createFollowNotification(followedUserId, followerId) {
  try {
    // Don't notify if user follows themselves
    if (followedUserId === followerId) return;

    await createNotification({
      userId: followedUserId,
      type: 'follow',
      title: 'Người theo dõi mới',
      content: 'Bạn có người theo dõi mới',
      relatedId: followerId,
      relatedType: 'user',
      actorId: followerId
    });
  } catch (error) {
    console.error('Error creating follow notification:', error);
  }
}

/**
 * Create promotion notification for all users
 * @param {string} title - Promotion title
 * @param {string} content - Promotion content
 */
async function createPromotionNotification(title, content) {
  try {
    // Get all active users
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE status = "active"'
    );

    // Create notification for each user
    const promises = users.map(user =>
      createNotification({
        userId: user.id,
        type: 'promotion',
        title,
        content,
        actorId: null // System notification
      })
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error creating promotion notifications:', error);
  }
}

module.exports = {
  createNotification,
  createLikeNotification,
  createCommentNotification,
  createFollowNotification,
  createPromotionNotification
};