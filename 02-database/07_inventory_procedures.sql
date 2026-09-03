USE reliefsync;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_add_stock$$

CREATE PROCEDURE sp_add_stock(
    IN p_shelter_code VARCHAR(20),
    IN p_item_code VARCHAR(20),
    IN p_quantity DECIMAL(12,2),
    IN p_created_by BIGINT UNSIGNED
)
BEGIN

    DECLARE v_inventory_id BIGINT UNSIGNED;
    DECLARE v_inventory_exists INT DEFAULT 0;
    DECLARE v_current_quantity DECIMAL(12,2);
    DECLARE v_new_quantity DECIMAL(12,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    -- Quantity must be positive
    IF p_quantity <= 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Stock quantity must be greater than zero';

    END IF;


    START TRANSACTION;


    -- ========================================
    -- FIND INVENTORY
    -- ========================================

    SELECT COUNT(*)
    INTO v_inventory_exists

    FROM shelter_inventory si

    JOIN shelters s
        ON si.shelter_id = s.shelter_id

    JOIN items i
        ON si.item_id = i.item_id

    WHERE s.shelter_code = p_shelter_code
      AND i.item_code = p_item_code;


    IF v_inventory_exists = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Inventory record does not exist for this shelter and item';

    END IF;


    -- Lock inventory row
    SELECT
        si.inventory_id,
        si.quantity

    INTO
        v_inventory_id,
        v_current_quantity

    FROM shelter_inventory si

    JOIN shelters s
        ON si.shelter_id = s.shelter_id

    JOIN items i
        ON si.item_id = i.item_id

    WHERE s.shelter_code = p_shelter_code
      AND i.item_code = p_item_code

    FOR UPDATE;


    SET v_new_quantity =
        v_current_quantity + p_quantity;


    -- ========================================
    -- UPDATE INVENTORY
    -- ========================================

    UPDATE shelter_inventory

    SET quantity = v_new_quantity

    WHERE inventory_id = v_inventory_id;


    -- ========================================
    -- RECORD TRANSACTION HISTORY
    -- ========================================

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
        v_new_quantity,
        'MANUAL_STOCK_IN',
        NULL,
        'Stock added through sp_add_stock',
        p_created_by
    );


    COMMIT;


    SELECT
        'Stock added successfully' AS message,
        p_shelter_code AS shelter,
        p_item_code AS item,
        p_quantity AS quantity_added,
        v_new_quantity AS current_stock;

END$$

DELIMITER ;