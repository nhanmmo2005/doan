-- Create notifications table and user_follows table for social features
-- Run this migration to add notifications and follow functionality

DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `user_follows`;

-- User follows table for follow functionality
CREATE TABLE `user_follows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `follower_id` int NOT NULL COMMENT 'User who is following',
  `following_id` int NOT NULL COMMENT 'User who is being followed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_follow` (`follower_id`, `following_id`),
  KEY `fk_follower` (`follower_id`),
  KEY `fk_following` (`following_id`),

  CONSTRAINT `fk_follower` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_following` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT 'User who receives the notification',
  `type` enum('like','comment','follow','promotion','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Notification title/headline',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Full notification content',
  `related_id` int DEFAULT NULL COMMENT 'ID of related post/comment/user',
  `related_type` enum('post','comment','user','restaurant') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actor_id` int DEFAULT NULL COMMENT 'User who performed the action',
  `actor_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Cached actor name',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `fk_notifications_user` (`user_id`),
  KEY `fk_notifications_actor` (`actor_id`),
  KEY `idx_user_read` (`user_id`, `is_read`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_type` (`type`),

  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample notifications for testing
INSERT INTO `notifications` (`user_id`, `type`, `title`, `content`, `related_id`, `related_type`, `actor_id`, `actor_name`, `is_read`) VALUES
(2, 'like', 'Đã thích bài viết', 'Nguyễn Văn A đã thích bài viết của bạn', 1, 'post', 1, 'Nguyễn Văn A', 0),
(2, 'comment', 'Bình luận mới', 'Trần Thị B đã bình luận: "Quán này ngon quá!"', 1, 'post', 1, 'Trần Thị B', 0),
(2, 'follow', 'Người theo dõi mới', 'Lê Văn C đã theo dõi bạn', NULL, NULL, 1, 'Lê Văn C', 0),
(2, 'promotion', 'Khuyến mãi đặc biệt', 'Giảm 20% cho đơn hàng trên 100k tại tất cả quán', NULL, NULL, NULL, 'Foodbook', 0),
(2, 'system', 'Chào mừng', 'Chào mừng bạn đến với Foodbook!', NULL, NULL, NULL, 'Foodbook', 1);