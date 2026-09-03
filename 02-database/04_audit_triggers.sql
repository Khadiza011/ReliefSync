USE reliefsync;

-- ============================================
-- AUDIT LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NULL,

    action_type VARCHAR(30) NOT NULL,

    entity_type VARCHAR(50) NOT NULL,

    entity_id BIGINT UNSIGNED NOT NULL,

    description VARCHAR(255) NOT NULL,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- Faster searching later
CREATE INDEX idx_audit_entity
ON audit_logs(entity_type, entity_id);

CREATE INDEX idx_audit_created_at
ON audit_logs(created_at);


-- ============================================
-- TRIGGER
-- Automatically logs every new admission
-- ============================================

DELIMITER $$

DROP TRIGGER IF EXISTS trg_admission_after_insert$$

CREATE TRIGGER trg_admission_after_insert

AFTER INSERT ON shelter_admissions

FOR EACH ROW

BEGIN

    INSERT INTO audit_logs
    (
        user_id,
        action_type,
        entity_type,
        entity_id,
        description
    )

    VALUES
    (
        NEW.admitted_by,
        'INSERT',
        'SHELTER_ADMISSION',
        NEW.admission_id,

        CONCAT(
            'Family ID ',
            NEW.family_id,
            ' admitted to Shelter ID ',
            NEW.shelter_id,
            ' with ',
            NEW.admitted_member_count,
            ' member(s)'
        )
    );

END$$

DELIMITER ;