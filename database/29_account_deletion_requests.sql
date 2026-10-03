USE reliefsync;

-- Run this once before replacing/restarting the code files.
-- deleted_at provides safe soft deletion without breaking historical foreign keys.
ALTER TABLE users
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;

CREATE TABLE IF NOT EXISTS account_deletion_requests (
    request_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    reason VARCHAR(255) NULL,
    status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by BIGINT UNSIGNED NULL,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    review_note VARCHAR(255) NULL,

    INDEX idx_account_delete_status (status, requested_at),
    INDEX idx_account_delete_user (user_id, status),

    CONSTRAINT fk_account_delete_user
      FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_account_delete_reviewer
      FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
);
