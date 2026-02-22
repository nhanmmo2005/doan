-- Migration: restaurant comments system
-- Supports threaded comments for restaurants

CREATE TABLE IF NOT EXISTS restaurant_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_id INT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_rest_cmt_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  CONSTRAINT fk_rest_cmt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_rest_cmt_parent FOREIGN KEY (parent_id) REFERENCES restaurant_comments(id) ON DELETE CASCADE,

  INDEX idx_rest_cmt_restaurant (restaurant_id),
  INDEX idx_rest_cmt_parent (parent_id),
  INDEX idx_rest_cmt_created (created_at)
);
