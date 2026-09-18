USE reliefsync;

-- ============================================
-- 1. ITEM CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS item_categories (
    category_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    category_name VARCHAR(80) NOT NULL UNIQUE
);


-- ============================================
-- 2. ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS items (
    item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    category_id SMALLINT UNSIGNED NOT NULL,

    item_code VARCHAR(20) NOT NULL UNIQUE,
    item_name VARCHAR(100) NOT NULL,
    unit VARCHAR(30) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_item_category
        FOREIGN KEY (category_id)
        REFERENCES item_categories(category_id)
);


-- ============================================
-- 3. SHELTER INVENTORY
-- One row = one item at one shelter
-- ============================================

CREATE TABLE IF NOT EXISTS shelter_inventory (
    inventory_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    shelter_id INT UNSIGNED NOT NULL,
    item_id INT UNSIGNED NOT NULL,

    quantity DECIMAL(12,2) NOT NULL DEFAULT 0,

    reorder_level DECIMAL(12,2) NOT NULL DEFAULT 0,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_shelter_inventory
        UNIQUE (shelter_id, item_id),

    CONSTRAINT chk_inventory_quantity
        CHECK (quantity >= 0),

    CONSTRAINT chk_reorder_level
        CHECK (reorder_level >= 0),

    CONSTRAINT fk_inventory_shelter
        FOREIGN KEY (shelter_id)
        REFERENCES shelters(shelter_id),

    CONSTRAINT fk_inventory_item
        FOREIGN KEY (item_id)
        REFERENCES items(item_id)
);


-- ============================================
-- 4. INVENTORY TRANSACTIONS
-- History of every stock IN / OUT
-- ============================================

CREATE TABLE IF NOT EXISTS inventory_transactions (
    txn_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    inventory_id BIGINT UNSIGNED NOT NULL,

    txn_type ENUM(
        'IN',
        'OUT',
        'ADJUSTMENT_IN',
        'ADJUSTMENT_OUT'
    ) NOT NULL,

    quantity DECIMAL(12,2) NOT NULL,

    balance_after DECIMAL(12,2) NOT NULL,

    reference_type VARCHAR(50),
    reference_id BIGINT UNSIGNED,

    notes VARCHAR(255),

    created_by BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_txn_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_txn_balance
        CHECK (balance_after >= 0),

    CONSTRAINT fk_txn_inventory
        FOREIGN KEY (inventory_id)
        REFERENCES shelter_inventory(inventory_id),

    CONSTRAINT fk_txn_user
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

ALTER TABLE inventory_transactions
DROP FOREIGN KEY fk_txn_user;

ALTER TABLE inventory_transactions
MODIFY created_by BIGINT UNSIGNED NOT NULL;

ALTER TABLE inventory_transactions

ADD CONSTRAINT fk_txn_user

FOREIGN KEY (created_by)

REFERENCES users(user_id)

ON DELETE RESTRICT;


-- ============================================
-- 5. RELIEF REQUESTS
-- ============================================

CREATE TABLE IF NOT EXISTS relief_requests (
    request_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    request_code VARCHAR(20) NOT NULL UNIQUE,

    shelter_id INT UNSIGNED NOT NULL,

    priority ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ) NOT NULL DEFAULT 'MEDIUM',

    status ENUM(
        'REQUESTED',
        'APPROVED',
        'PARTIALLY_DELIVERED',
        'DELIVERED',
        'REJECTED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'REQUESTED',

    requested_by BIGINT UNSIGNED NULL,

    requested_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    approved_by BIGINT UNSIGNED NULL,
    approved_at TIMESTAMP NULL,

    notes VARCHAR(255),

    CONSTRAINT fk_request_shelter
        FOREIGN KEY (shelter_id)
        REFERENCES shelters(shelter_id),

    CONSTRAINT fk_request_requested_by
        FOREIGN KEY (requested_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_request_approved_by
        FOREIGN KEY (approved_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- ============================================
-- 6. RELIEF REQUEST ITEMS
-- One request can contain many items
-- ============================================

CREATE TABLE IF NOT EXISTS relief_request_items (
    request_id BIGINT UNSIGNED NOT NULL,

    item_id INT UNSIGNED NOT NULL,

    requested_qty DECIMAL(12,2) NOT NULL,

    fulfilled_qty DECIMAL(12,2) NOT NULL DEFAULT 0,

    PRIMARY KEY (request_id, item_id),

    CONSTRAINT chk_requested_qty
        CHECK (requested_qty > 0),

    CONSTRAINT chk_fulfilled_qty
        CHECK (fulfilled_qty >= 0),

    CONSTRAINT fk_request_item_request
        FOREIGN KEY (request_id)
        REFERENCES relief_requests(request_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_request_item_item
        FOREIGN KEY (item_id)
        REFERENCES items(item_id)
);

ALTER TABLE relief_request_items
ADD COLUMN request_item_id BIGINT UNSIGNED FIRST;

ALTER TABLE relief_request_items
DROP FOREIGN KEY fk_request_item_item;

ALTER TABLE relief_request_items
DROP FOREIGN KEY fk_request_item_request;

ALTER TABLE relief_request_items
DROP PRIMARY KEY;

ALTER TABLE relief_request_items
MODIFY COLUMN request_item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
ADD PRIMARY KEY(request_item_id);

ALTER TABLE relief_request_items
ADD UNIQUE(request_id,item_id);

ALTER TABLE relief_request_items
ADD CONSTRAINT fk_request_item_item
FOREIGN KEY (item_id)
REFERENCES items(item_id)
ON DELETE CASCADE;


ALTER TABLE relief_request_items
ADD CONSTRAINT fk_request_item_request
FOREIGN KEY (request_id)
REFERENCES relief_requests(request_id)
ON DELETE CASCADE;
-- ============================================
-- 7. DISTRIBUTIONS
-- A request may have multiple distributions
-- ============================================

CREATE TABLE IF NOT EXISTS distributions (
    distribution_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    distribution_code VARCHAR(20) NOT NULL UNIQUE,

    request_id BIGINT UNSIGNED NOT NULL,

    status ENUM(
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'COMPLETED',

    distributed_by BIGINT UNSIGNED NULL,

    distributed_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    notes VARCHAR(255),

    CONSTRAINT fk_distribution_request
        FOREIGN KEY (request_id)
        REFERENCES relief_requests(request_id),

    CONSTRAINT fk_distribution_user
        FOREIGN KEY (distributed_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- ============================================
-- 8. DISTRIBUTION ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS distribution_items (
    distribution_id BIGINT UNSIGNED NOT NULL,

    item_id INT UNSIGNED NOT NULL,

    quantity DECIMAL(12,2) NOT NULL,

    PRIMARY KEY (distribution_id, item_id),

    CONSTRAINT chk_distribution_quantity
        CHECK (quantity > 0),

    CONSTRAINT fk_dist_item_distribution
        FOREIGN KEY (distribution_id)
        REFERENCES distributions(distribution_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_dist_item_item
        FOREIGN KEY (item_id)
        REFERENCES items(item_id)
);

ALTER TABLE distribution_items
ADD COLUMN request_item_id BIGINT UNSIGNED AFTER distribution_id;

ALTER TABLE distribution_items
ADD CONSTRAINT fk_distribution_request_item
FOREIGN KEY (request_item_id)
REFERENCES relief_request_items(request_item_id)
ON DELETE CASCADE;

ALTER TABLE distribution_items
DROP FOREIGN KEY fk_dist_item_distribution;

ALTER TABLE distribution_items
DROP FOREIGN KEY fk_dist_item_item;

ALTER TABLE distribution_items
DROP PRIMARY KEY;

ALTER TABLE distribution_items
ADD COLUMN distribution_item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;

ALTER TABLE distribution_items
ADD UNIQUE(distribution_id, request_item_id);

ALTER TABLE distribution_items
ADD CONSTRAINT fk_dist_item_distribution
FOREIGN KEY (distribution_id)
REFERENCES distributions(distribution_id)
ON DELETE CASCADE;

ALTER TABLE distribution_items
ADD CONSTRAINT fk_dist_item_item
FOREIGN KEY (item_id)
REFERENCES items(item_id)
ON DELETE CASCADE;

ALTER TABLE distribution_items
MODIFY request_item_id BIGINT UNSIGNED NOT NULL;

ALTER TABLE distributions
MODIFY status ENUM(
    'PENDING',
    'COMPLETED',
    'CANCELLED'
)
NOT NULL DEFAULT 'PENDING';

ALTER TABLE distributions
ADD approved_by BIGINT UNSIGNED NULL,
ADD approved_at TIMESTAMP NULL;

ALTER TABLE distributions
DROP FOREIGN KEY fk_distribution_user;

ALTER TABLE distributions
MODIFY distributed_by BIGINT UNSIGNED NOT NULL;

ALTER TABLE distributions
ADD CONSTRAINT fk_distribution_user
FOREIGN KEY (distributed_by)
REFERENCES users(user_id)
ON DELETE RESTRICT;

ALTER TABLE distributions
ADD CONSTRAINT fk_distribution_approved_by
FOREIGN KEY (approved_by)
REFERENCES users(user_id)
ON DELETE SET NULL;

ALTER TABLE relief_requests
DROP FOREIGN KEY fk_request_requested_by;

ALTER TABLE relief_requests
MODIFY requested_by BIGINT UNSIGNED NOT NULL;

ALTER TABLE relief_requests
ADD CONSTRAINT fk_request_requested_by
FOREIGN KEY (requested_by)
REFERENCES users(user_id)
ON DELETE RESTRICT;

ALTER TABLE distributions
DROP FOREIGN KEY fk_distribution_approved_by;

ALTER TABLE distributions
DROP COLUMN approved_by,
DROP COLUMN approved_at;