USE reliefsync;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_distribute_relief$$

CREATE PROCEDURE sp_distribute_relief(
    IN p_distribution_code VARCHAR(20),
    IN p_request_code VARCHAR(20),
    IN p_item_code VARCHAR(20),
    IN p_quantity DECIMAL(12,2),
    IN p_distributed_by BIGINT UNSIGNED
)
BEGIN

    DECLARE v_request_id BIGINT UNSIGNED;
    DECLARE v_shelter_id INT UNSIGNED;
    DECLARE v_request_status VARCHAR(30);

    DECLARE v_item_id INT UNSIGNED;

    DECLARE v_requested_qty DECIMAL(12,2);
    DECLARE v_fulfilled_qty DECIMAL(12,2);
    DECLARE v_remaining_request_qty DECIMAL(12,2);

    DECLARE v_inventory_id BIGINT UNSIGNED;
    DECLARE v_stock DECIMAL(12,2);
    DECLARE v_new_stock DECIMAL(12,2);

    DECLARE v_distribution_id BIGINT UNSIGNED;

    DECLARE v_request_exists INT DEFAULT 0;
    DECLARE v_item_exists INT DEFAULT 0;
    DECLARE v_inventory_exists INT DEFAULT 0;

    DECLARE v_remaining_items INT DEFAULT 0;


    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    IF p_quantity <= 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Distribution quantity must be greater than zero';

    END IF;


    START TRANSACTION;


    -- ============================================
    -- 1. CHECK REQUEST
    -- ============================================

    SELECT COUNT(*)
    INTO v_request_exists

    FROM relief_requests

    WHERE request_code = p_request_code;


    IF v_request_exists = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Relief request does not exist';

    END IF;


    SELECT
        request_id,
        shelter_id,
        status

    INTO
        v_request_id,
        v_shelter_id,
        v_request_status

    FROM relief_requests

    WHERE request_code = p_request_code

    FOR UPDATE;


    -- ============================================
    -- 2. REQUEST MUST BE APPROVED
    -- ============================================

    IF v_request_status NOT IN (
        'APPROVED',
        'PARTIALLY_DELIVERED'
    ) THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Request is not approved for distribution';

    END IF;


    -- ============================================
    -- 3. FIND REQUESTED ITEM
    -- ============================================

    SELECT COUNT(*)
    INTO v_item_exists

    FROM relief_request_items rri

    JOIN items i
        ON rri.item_id = i.item_id

    WHERE rri.request_id = v_request_id
      AND i.item_code = p_item_code;


    IF v_item_exists = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'This item was not requested';

    END IF;


    SELECT
        rri.item_id,
        rri.requested_qty,
        rri.fulfilled_qty

    INTO
        v_item_id,
        v_requested_qty,
        v_fulfilled_qty

    FROM relief_request_items rri

    JOIN items i
        ON rri.item_id = i.item_id

    WHERE rri.request_id = v_request_id
      AND i.item_code = p_item_code

    FOR UPDATE;


    SET v_remaining_request_qty =
        v_requested_qty - v_fulfilled_qty;


    IF p_quantity > v_remaining_request_qty THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Distribution exceeds remaining requested quantity';

    END IF;


    -- ============================================
    -- 4. CHECK INVENTORY
    -- ============================================

    SELECT COUNT(*)
    INTO v_inventory_exists

    FROM shelter_inventory

    WHERE shelter_id = v_shelter_id
      AND item_id = v_item_id;


    IF v_inventory_exists = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Inventory record not found';

    END IF;


    SELECT
        inventory_id,
        quantity

    INTO
        v_inventory_id,
        v_stock

    FROM shelter_inventory

    WHERE shelter_id = v_shelter_id
      AND item_id = v_item_id

    FOR UPDATE;


    -- ============================================
    -- 5. CHECK STOCK
    -- ============================================

    IF p_quantity > v_stock THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Insufficient inventory stock';

    END IF;


    SET v_new_stock =
        v_stock - p_quantity;


    -- ============================================
    -- 6. CREATE DISTRIBUTION
    -- ============================================

    INSERT INTO distributions
    (
        distribution_code,
        request_id,
        status,
        distributed_by
    )

    VALUES
    (
        p_distribution_code,
        v_request_id,
        'COMPLETED',
        p_distributed_by
    );


    SET v_distribution_id =
        LAST_INSERT_ID();


    -- ============================================
    -- 7. CREATE DISTRIBUTION ITEM
    -- ============================================

    INSERT INTO distribution_items
    (
        distribution_id,
        item_id,
        quantity
    )

    VALUES
    (
        v_distribution_id,
        v_item_id,
        p_quantity
    );


    -- ============================================
    -- 8. DEDUCT STOCK
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
        'OUT',
        p_quantity,
        v_new_stock,
        'DISTRIBUTION',
        v_distribution_id,
        'Relief distribution',
        p_distributed_by
    );


    -- ============================================
    -- 10. UPDATE FULFILLED QUANTITY
    -- ============================================

    UPDATE relief_request_items

    SET fulfilled_qty =
        fulfilled_qty + p_quantity

    WHERE request_id = v_request_id
      AND item_id = v_item_id;


    -- ============================================
    -- 11. CHECK WHETHER REQUEST COMPLETED
    -- ============================================

    SELECT COUNT(*)
    INTO v_remaining_items

    FROM relief_request_items

    WHERE request_id = v_request_id
      AND fulfilled_qty < requested_qty;


    IF v_remaining_items = 0 THEN

        UPDATE relief_requests

        SET status = 'DELIVERED'

        WHERE request_id = v_request_id;

    ELSE

        UPDATE relief_requests

        SET status = 'PARTIALLY_DELIVERED'

        WHERE request_id = v_request_id;

    END IF;


    COMMIT;


    SELECT
        'Distribution successful' AS message,
        p_distribution_code AS distribution_code,
        p_request_code AS request_code,
        p_item_code AS item_code,
        p_quantity AS distributed_quantity,
        v_new_stock AS remaining_stock;

END$$

DELIMITER ;