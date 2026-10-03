USE reliefsync;

CREATE TABLE IF NOT EXISTS inventory_stock_reports (
    report_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    inventory_id BIGINT UNSIGNED NOT NULL,
    shelter_id INT UNSIGNED NOT NULL,
    item_id INT UNSIGNED NOT NULL,
    volunteer_id BIGINT UNSIGNED NOT NULL,
    quantity_at_report DECIMAL(12,2) NOT NULL,
    reorder_level_at_report DECIMAL(12,2) NOT NULL,
    note VARCHAR(255) NULL,
    status ENUM('OPEN','ACKNOWLEDGED') NOT NULL DEFAULT 'OPEN',
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP NULL DEFAULT NULL,
    acknowledged_by BIGINT UNSIGNED NULL,

    CONSTRAINT fk_stock_report_inventory
        FOREIGN KEY (inventory_id) REFERENCES shelter_inventory(inventory_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_stock_report_shelter
        FOREIGN KEY (shelter_id) REFERENCES shelters(shelter_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_stock_report_item
        FOREIGN KEY (item_id) REFERENCES items(item_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_stock_report_volunteer
        FOREIGN KEY (volunteer_id) REFERENCES volunteers(volunteer_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_stock_report_ack_user
        FOREIGN KEY (acknowledged_by) REFERENCES users(user_id)
        ON DELETE SET NULL,

    INDEX idx_stock_reports_shelter_status (shelter_id, status),
    INDEX idx_stock_reports_inventory_status (inventory_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
