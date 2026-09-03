USE reliefsync;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_assign_volunteer$$

CREATE PROCEDURE sp_assign_volunteer(
    IN p_volunteer_code VARCHAR(20),
    IN p_shelter_code VARCHAR(20),
    IN p_skill_name VARCHAR(100),
    IN p_task_title VARCHAR(150),
    IN p_assigned_by BIGINT UNSIGNED
)
BEGIN

    DECLARE v_volunteer_id BIGINT UNSIGNED;
    DECLARE v_shelter_id INT UNSIGNED;
    DECLARE v_skill_id SMALLINT UNSIGNED;

    DECLARE v_availability VARCHAR(20);
    DECLARE v_shelter_status VARCHAR(20);

    DECLARE v_volunteer_exists INT DEFAULT 0;
    DECLARE v_shelter_exists INT DEFAULT 0;
    DECLARE v_skill_exists INT DEFAULT 0;

    DECLARE v_has_skill INT DEFAULT 0;
    DECLARE v_active_assignments INT DEFAULT 0;


    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    START TRANSACTION;


    -- ============================================
    -- 1. CHECK VOLUNTEER
    -- ============================================

    SELECT
        COUNT(*),
        MAX(volunteer_id)

    INTO
        v_volunteer_exists,
        v_volunteer_id

    FROM volunteers

    WHERE volunteer_code = p_volunteer_code;


    IF v_volunteer_exists = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Volunteer does not exist';

    END IF;


    -- Lock volunteer row
    SELECT availability

    INTO v_availability

    FROM volunteers

    WHERE volunteer_id = v_volunteer_id

    FOR UPDATE;


    IF v_availability <> 'AVAILABLE' THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Volunteer is not currently available';

    END IF;


    -- ============================================
    -- 2. CHECK SHELTER
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


    SELECT operational_status

    INTO v_shelter_status

    FROM shelters

    WHERE shelter_id = v_shelter_id;


    IF v_shelter_status <> 'OPEN' THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Cannot assign volunteer to a closed shelter';

    END IF;


    -- ============================================
    -- 3. CHECK SKILL
    -- ============================================

    SELECT
        COUNT(*),
        MAX(skill_id)

    INTO
        v_skill_exists,
        v_skill_id

    FROM skills

    WHERE skill_name = p_skill_name;


    IF v_skill_exists = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Required skill does not exist';

    END IF;


    -- ============================================
    -- 4. CHECK VOLUNTEER HAS REQUIRED SKILL
    -- ============================================

    SELECT COUNT(*)

    INTO v_has_skill

    FROM volunteer_skills

    WHERE volunteer_id = v_volunteer_id
      AND skill_id = v_skill_id;


    IF v_has_skill = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Volunteer does not have the required skill';

    END IF;


    -- ============================================
    -- 5. CHECK ACTIVE ASSIGNMENT
    -- ============================================

    SELECT COUNT(*)

    INTO v_active_assignments

    FROM assignments

    WHERE volunteer_id = v_volunteer_id
      AND status = 'ACTIVE';


    IF v_active_assignments > 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Volunteer already has an active assignment';

    END IF;


    -- ============================================
    -- 6. CREATE ASSIGNMENT
    -- ============================================

    INSERT INTO assignments
    (
        volunteer_id,
        shelter_id,
        skill_id,
        task_title,
        status,
        assigned_by
    )

    VALUES
    (
        v_volunteer_id,
        v_shelter_id,
        v_skill_id,
        p_task_title,
        'ACTIVE',
        p_assigned_by
    );


    -- ============================================
    -- 7. MARK VOLUNTEER BUSY
    -- ============================================

    UPDATE volunteers

    SET availability = 'BUSY'

    WHERE volunteer_id = v_volunteer_id;


    COMMIT;


    SELECT
        'Volunteer assigned successfully' AS message,
        p_volunteer_code AS volunteer,
        p_shelter_code AS shelter,
        p_skill_name AS required_skill,
        p_task_title AS task;

END$$

DELIMITER ;