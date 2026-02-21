-- Migration: reports system
-- Supports reports for: post, eating_plan, post_comment, review_comment, eating_plan_comment, message

CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,

  reporter_user_id INT NOT NULL,

  target_type VARCHAR(50) NOT NULL,
  target_id INT NOT NULL,

  reason VARCHAR(50) NOT NULL,
  reason_text TEXT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'pending',

  admin_user_id INT NULL,
  admin_note TEXT NULL,
  action VARCHAR(30) NOT NULL DEFAULT 'none',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_reports_target (target_type, target_id),
  INDEX idx_reports_status (status),
  INDEX idx_reports_created_at (created_at),
  INDEX idx_reports_reporter (reporter_user_id)
);

-- NOTE:
-- We intentionally DO NOT create a unique index for (reporter_user_id, target_type, target_id)
-- because we only want to block duplicates while status is pending/reviewing.
-- MySQL doesn't support partial unique indexes, so we enforce this rule in application logic.
