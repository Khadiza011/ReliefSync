USE reliefsync;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_complete_assignment$$

CREATE PROCEDURE sp_complete_assignment(
    IN p_assignment_id BIGINT UNSIGNED
)
BEGIN

    DECLARE v_volunteer_id BIGINT UNSIGNED;
    DECLARE v_assignment_exists INT DEFAULT 0;
    DECLARE v_status VARCHAR(20);


    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;


    START TRANSACTION;


    SELECT COUNT(*)

    INTO v_assignment_exists

    FROM assignments

    WHERE assignment_id = p_assignment_id;


    IF v_assignment_exists = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Assignment does not exist';

    END IF;


    SELECT
        volunteer_id,
        status

    INTO
        v_volunteer_id,
        v_status

    FROM assignments

    WHERE assignment_id = p_assignment_id

    FOR UPDATE;


    IF v_status <> 'ACTIVE' THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
        'Only active assignments can be completed';

    END IF;


    UPDATE assignments

    SET
        status = 'COMPLETED',
        completed_at = CURRENT_TIMESTAMP

    WHERE assignment_id = p_assignment_id;


    UPDATE volunteers

    SET availability = 'AVAILABLE'

    WHERE volunteer_id = v_volunteer_id;


    COMMIT;


    SELECT
        'Assignment completed successfully' AS message,
        p_assignment_id AS assignment_id;

END$$

DELIMITER ;