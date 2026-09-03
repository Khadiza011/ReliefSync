USE reliefsync;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_receive_donation$$

CREATE PROCEDURE sp_receive_donation(
    IN p_donation_code VARCHAR(20),
    IN p_donor_code VARCHAR(20),
    IN p_shelter_code VARCHAR(20),
    IN p_item_code VARCHAR(20),
    IN p_quantity DECIMAL(12,2),
    IN p_received_by BIGINT UNSIGNED
)
BEGIN

    DECLARE v_donor_id BIGINT UNSIGNED;
    DECLARE v_shelter_id INT UNSIGNED;
    DECLARE v_item_id INT UNSIGNED;

    DECLARE v_inventory_id BIGINT UNSIGNED;
    DECLARE v_current_stock DECIMAL(12,2);
    DECLARE v_new_stock DECIMAL(12,2);

    DECLARE v_donation_id BIGINT UNSIGNED;

    DECLARE v_donor_exists INT DEFAULT 0;
    DECLARE v_shelter_exists INT DEFAULT 0;
    DECLARE v_item_exists INT DEFAULT 0;
    DECLARE v_inventory_exists INT DEFAULT 0;
    DECLARE v_donation_exists INT DEFAULT 0;


    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    IF p_quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Donation quantity must be greater than zero';
    END IF;


    START TRANSACTION;


    -- ============================================
    -- 1. CHECK DUPLICATE DONATION CODE
    -- ============================================

    SELECT COUNT(*)
    INTO v_donation_exists
    FROM donations
    WHERE donation_code = p_donation_code;


    IF v_donation_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Donation code already exists';
    END IF;


    -- ============================================
    -- 2. FIND DONOR
    -- ============================================

    SELECT
        COUNT(*),
        MAX(donor_id)

    INTO
        v_donor_exists,
        v_donor_id

    FROM donors
    WHERE donor_code = p_donor_code;


    IF v_donor_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Donor does not exist';
    END IF;


    -- ============================================
    -- 3. FIND SHELTER
    -- ============================================

    SELECT
        COUNT(*),
        MAX(shelter_id)

    INTO
        v_shelter_exists,
        v_shelter_id

    FROM shelters
    WHERE shelter_code = p_shelter_code;


    IF v_shelter_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Shelter does not exist';
    END IF;


    -- ============================================
    -- 4. FIND ITEM
    -- ============================================

    SELECT
        COUNT(*),
        MAX(item_id)

    INTO
        v_item_exists,
        v_item_id

    FROM items
    WHERE item_code = p_item_code;


    IF v_item_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Item does not exist';
    END IF;


    -- ============================================
    -- 5. FIND INVENTORY RECORD
    -- ============================================

    SELECT COUNT(*)
    INTO v_inventory_exists

    FROM shelter_inventory

    WHERE shelter_id = v_shelter_id
      AND item_id = v_item_id;


    IF v_inventory_exists = 0 THEN

        INSERT INTO shelter_inventory
        (
            shelter_id,
            item_id,
            quantity,
            reorder_level
        )

        VALUES
        (
            v_shelter_id,
            v_item_id,
            0,
            0
        );

    END IF;


    -- Lock inventory
    SELECT
        inventory_id,
        quantity

    INTO
        v_inventory_id,
        v_current_stock

    FROM shelter_inventory

    WHERE shelter_id = v_shelter_id
      AND item_id = v_item_id

    FOR UPDATE;


    SET v_new_stock =
        v_current_stock + p_quantity;


    -- ============================================
    -- 6. CREATE DONATION
    -- ============================================

    INSERT INTO donations
    (
        donation_code,
        donor_id,
        shelter_id,
        status,
        received_by
    )

    VALUES
    (
        p_donation_code,
        v_donor_id,
        v_shelter_id,
        'RECEIVED',
        p_received_by
    );


    SET v_donation_id =
        LAST_INSERT_ID();


    -- ============================================
    -- 7. DONATION ITEM
    -- ============================================

    INSERT INTO donation_items
    (
        donation_id,
        item_id,
        quantity
    )

    VALUES
    (
        v_donation_id,
        v_item_id,
        p_quantity
    );


    -- ============================================
    -- 8. UPDATE INVENTORY
    -- ============================================

    UPDATE shelter_inventory

    SET quantity = v_new_stock

    WHERE inventory_id = v_inventory_id;


    -- ============================================
    -- 9. INVENTORY TRANSACTION
    -- ============================================

    INSERT INTO inventory_transactions
    (
        inventory_id,
        txn_type,
        quantity,
        balance_after,
        reference_type,
        reference_id,
        notes,
        created_by
    )

    VALUES
    (
        v_inventory_id,
        'IN',
        p_quantity,
        v_new_stock,
        'DONATION',
        v_donation_id,
        'Stock received from donation',
        p_received_by
    );


    COMMIT;


    SELECT
        'Donation received successfully' AS message,
        p_donation_code AS donation_code,
        p_donor_code AS donor_code,
        p_item_code AS item_code,
        p_quantity AS donated_quantity,
        v_new_stock AS current_stock;

END$$

DELIMITER ;