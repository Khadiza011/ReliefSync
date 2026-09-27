USE reliefsync;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_admit_family$$

CREATE PROCEDURE sp_admit_family(
    IN p_family_code VARCHAR(20),
    IN p_shelter_code VARCHAR(20),
    IN p_admitted_by BIGINT UNSIGNED
)
BEGIN

    DECLARE v_family_id BIGINT UNSIGNED;
    DECLARE v_shelter_id INT UNSIGNED;

    DECLARE v_family_exists INT DEFAULT 0;
    DECLARE v_shelter_exists INT DEFAULT 0;
    DECLARE v_user_exists INT DEFAULT 0;

    DECLARE v_family_size INT DEFAULT 0;

    DECLARE v_total_capacity INT DEFAULT 0;
    DECLARE v_current_occupancy INT DEFAULT 0;
    DECLARE v_available_capacity INT DEFAULT 0;

    DECLARE v_operational_status VARCHAR(20);

    DECLARE v_active_admission_count INT DEFAULT 0;


    -- Rollback everything if any SQL error occurs
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    START TRANSACTION;


    -- ==========================================
    -- 1. CHECK FAMILY
    -- ==========================================

    SELECT
        COUNT(*),
        MAX(family_id)
    INTO
        v_family_exists,
        v_family_id
    FROM families
    WHERE family_code = p_family_code;


    IF v_family_exists = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Family does not exist';

    END IF;


    -- ==========================================
    -- 2. CHECK SHELTER
    -- ==========================================

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
        SET MESSAGE_TEXT = 'Shelter does not exist';

    END IF;


    -- ==========================================
    -- 3. CHECK USER
    -- ==========================================

    SELECT COUNT(*)
    INTO v_user_exists
    FROM users
    WHERE user_id = p_admitted_by;


    IF v_user_exists = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Admitting user does not exist';

    END IF;


    -- ==========================================
    -- 4. LOCK SHELTER + GET CAPACITY
    -- ==========================================

    SELECT
        total_capacity,
        operational_status
    INTO
        v_total_capacity,
        v_operational_status
    FROM shelters
    WHERE shelter_id = v_shelter_id
    FOR UPDATE;


    -- ==========================================
    -- 5. CHECK SHELTER STATUS
    -- ==========================================

    IF v_operational_status <> 'OPEN' THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Shelter is closed';

    END IF;


    -- ==========================================
    -- 6. COUNT FAMILY MEMBERS
    -- ==========================================

    SELECT COUNT(*)
    INTO v_family_size
    FROM family_members
    WHERE family_id = v_family_id;


    IF v_family_size = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Family has no registered members';

    END IF;


    -- ==========================================
    -- 7. CHECK EXISTING ACTIVE ADMISSION
    -- ==========================================

    SELECT COUNT(*)
    INTO v_active_admission_count
    FROM shelter_admissions
    WHERE family_id = v_family_id
      AND status = 'ACTIVE';


    IF v_active_admission_count > 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Family already has an active shelter admission';

    END IF;


    -- ==========================================
    -- 8. CALCULATE CURRENT OCCUPANCY
    -- ==========================================

    SELECT
        COALESCE(SUM(admitted_member_count), 0)
    INTO
        v_current_occupancy
    FROM shelter_admissions
    WHERE shelter_id = v_shelter_id
      AND status = 'ACTIVE';


    SET v_available_capacity =
        v_total_capacity - v_current_occupancy;


    -- ==========================================
    -- 9. CHECK CAPACITY
    -- ==========================================

    IF v_family_size > v_available_capacity THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Insufficient shelter capacity';

    END IF;


    -- ==========================================
    -- 10. CREATE ADMISSION
    -- ==========================================

    INSERT INTO shelter_admissions
    (
        family_id,
        shelter_id,
        admitted_member_count,
        status,
        admitted_by
    )
    VALUES
    (
        v_family_id,
        v_shelter_id,
        v_family_size,
        'ACTIVE',
        p_admitted_by
    );


    -- ==========================================
    -- 11. UPDATE FAMILY STATUS
    -- ==========================================

    UPDATE families
    SET status = 'SHELTERED'
    WHERE family_id = v_family_id;


    COMMIT;


    -- ==========================================
    -- SUCCESS RESPONSE
    -- ==========================================

    SELECT
        'Family admitted successfully' AS message,
        p_family_code AS family_code,
        p_shelter_code AS shelter_code,
        p_admitted_by AS admitted_by,
        v_family_size AS admitted_members,
        v_available_capacity - v_family_size
            AS remaining_capacity;


END$$

DELIMITER ;