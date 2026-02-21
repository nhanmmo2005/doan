-- Migration to add description and multiple images support for restaurants
-- Safe to run multiple times.

-- 1) Add description column if it does not exist
SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'restaurants'
    AND COLUMN_NAME = 'description'
);

SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `restaurants` ADD COLUMN `description` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci AFTER `address`;',
  'SELECT "OK: restaurants.description already exists";'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Create restaurant_media table (multi images/videos)
CREATE TABLE IF NOT EXISTS `restaurant_media` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `restaurant_id` INT NOT NULL,
  `media_type` ENUM('image', 'video') NOT NULL DEFAULT 'image',
  `url` TEXT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_restaurant_media_restaurant` (`restaurant_id`),
  KEY `idx_restaurant_media_sort` (`restaurant_id`, `sort_order`),
  CONSTRAINT `fk_restaurant_media_restaurant` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
