USE reliefsync;

-- ============================================
-- 1. DONORS
-- ============================================

CREATE TABLE IF NOT EXISTS donors (
    donor_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NULL,

    donor_code VARCHAR(20) NOT NULL UNIQUE,
    donor_name VARCHAR(120) NOT NULL,

    donor_type ENUM(
        'INDIVIDUAL',
        'ORGANIZATION',
        'ANONYMOUS'
    ) NOT NULL DEFAULT 'INDIVIDUAL',

    phone VARCHAR(20),
    email VARCHAR(150),

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_donor_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- ============================================
-- 2. DONATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS donations (
    donation_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    donation_code VARCHAR(20) NOT NULL UNIQUE,

    donor_id BIGINT UNSIGNED NOT NULL,

    shelter_id INT UNSIGNED NOT NULL,

    status ENUM(
        'RECEIVED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'RECEIVED',

    received_by BIGINT UNSIGNED NULL,

    received_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    notes VARCHAR(255),

    CONSTRAINT fk_donation_donor
        FOREIGN KEY (donor_id)
        REFERENCES donors(donor_id),

    CONSTRAINT fk_donation_shelter
        FOREIGN KEY (shelter_id)
        REFERENCES shelters(shelter_id),

    CONSTRAINT fk_donation_received_by
        FOREIGN KEY (received_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

ALTER TABLE donations
DROP FOREIGN KEY fk_donation_received_by;

ALTER TABLE donations
MODIFY received_by BIGINT UNSIGNED NOT NULL;

ALTER TABLE donations

ADD CONSTRAINT fk_donation_received_by
FOREIGN KEY (received_by)
REFERENCES users(user_id)
ON DELETE RESTRICT;
-- ============================================
-- 3. DONATION ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS donation_items (
    donation_id BIGINT UNSIGNED NOT NULL,

    item_id INT UNSIGNED NOT NULL,

    quantity DECIMAL(12,2) NOT NULL,

    PRIMARY KEY (donation_id, item_id),

    CONSTRAINT chk_donation_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT fk_donation_item_donation
        FOREIGN KEY (donation_id)
        REFERENCES donations(donation_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_donation_item_item
        FOREIGN KEY (item_id)
        REFERENCES items(item_id)
);

ALTER TABLE donations
MODIFY status ENUM(
    'PENDING',
    'RECEIVED',
    'CANCELLED'
)
DEFAULT 'PENDING';

ALTER TABLE donations
MODIFY received_by BIGINT UNSIGNED NULL;