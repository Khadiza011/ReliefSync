const db = require("../config/db");

// Business-rule errors carry their own HTTP status
class AdmissionError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}


// =====================================
// CREATE SHELTER ADMISSION
// =====================================

const createAdmission = async (req, res) => {

    const { family_id, shelter_id } = req.body;
    const admitted_member_count = Number(req.body.admitted_member_count);
    const user_id = req.user.user_id;
    const role_id = req.user.role_id;

    if (!family_id || !shelter_id || !Number.isInteger(admitted_member_count) || admitted_member_count < 1) {
        return res.status(400).json({ message: "Family, shelter and a valid member count are required" });
    }

    let connection;

    try {

        // SHELTER MANAGER can only admit into shelters they manage
        if (role_id !== 1) {
            const [managed] = await db.query(
                `SELECT id FROM shelter_managers WHERE user_id = ? AND shelter_id = ?`,
                [user_id, shelter_id]
            );
            if (managed.length === 0) {
                return res.status(403).json({ message: "You cannot manage this shelter" });
            }
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // LOCK SHELTER ROW (prevents two admissions overfilling at once)
        const [shelterRows] = await connection.query(
            `SELECT shelter_id, shelter_name, total_capacity, current_occupancy, operational_status
             FROM shelters WHERE shelter_id = ? FOR UPDATE`,
            [shelter_id]
        );
        if (shelterRows.length === 0) {
            throw new AdmissionError(404, "Shelter not found");
        }
        const shelter = shelterRows[0];

        // FAMILY MUST EXIST
        const [familyRows] = await connection.query(
            `SELECT family_id, status FROM families WHERE family_id = ? FOR UPDATE`,
            [family_id]
        );
        if (familyRows.length === 0) {
            throw new AdmissionError(404, "Family not found");
        }

        // BLOCK REPEAT ADMISSION (same family already has an ACTIVE stay)
        const [activeStay] = await connection.query(
            `SELECT admission_id FROM shelter_admissions WHERE family_id = ? AND status = 'ACTIVE' LIMIT 1`,
            [family_id]
        );
        if (activeStay.length > 0) {
            throw new AdmissionError(400, "This family is already admitted to a shelter");
        }

        // SHELTER MUST BE OPEN AND HAVE SPACE
        if (shelter.operational_status !== "OPEN") {
            throw new AdmissionError(400, "Shelter is not accepting admissions (" + shelter.operational_status + ")");
        }
        const free = Number(shelter.total_capacity) - Number(shelter.current_occupancy || 0);
        if (admitted_member_count > free) {
            throw new AdmissionError(400, "Only " + Math.max(free, 0) + " places available in this shelter");
        }

        // INSERT ADMISSION (DB trigger writes the audit log)
        const [result] = await connection.query(
            `INSERT INTO shelter_admissions
             (family_id, shelter_id, admitted_member_count, admitted_by)
             VALUES (?, ?, ?, ?)`,
            [family_id, shelter_id, admitted_member_count, user_id]
        );

        // UPDATE SHELTER OCCUPANCY + STATUS
        const newOccupancy = Number(shelter.current_occupancy || 0) + admitted_member_count;
        const newStatus = newOccupancy >= Number(shelter.total_capacity) ? "FULL" : "OPEN";
        await connection.query(
            `UPDATE shelters SET current_occupancy = ?, operational_status = ? WHERE shelter_id = ?`,
            [newOccupancy, newStatus, shelter_id]
        );

        // UPDATE FAMILY STATUS
        await connection.query(
            `UPDATE families SET status = 'SHELTERED' WHERE family_id = ?`,
            [family_id]
        );

        await connection.commit();

        res.json({
            message: "Family admitted successfully",
            admission_id: result.insertId
        });

    } catch (err) {

        if (connection) {
            await connection.rollback().catch(() => {});
        }

        if (err instanceof AdmissionError) {
            return res.status(err.status).json({ message: err.message });
        }

        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });

    } finally {
        if (connection) connection.release();
    }
};


// =====================================
// DISCHARGE FAMILY FROM SHELTER
// =====================================

const dischargeAdmission = async (req, res) => {
    const admission_id = Number(req.params.id);
    const user_id = req.user.user_id;
    const role_id = req.user.role_id;

    if (!Number.isInteger(admission_id) || admission_id < 1) {
        return res.status(400).json({ message: "Invalid admission ID" });
    }

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Lock both the admission and its shelter so occupancy cannot race.
        const [rows] = await connection.query(
            `SELECT
                sa.admission_id,
                sa.family_id,
                sa.shelter_id,
                sa.admitted_member_count,
                sa.status,
                s.current_occupancy,
                s.total_capacity,
                s.operational_status
             FROM shelter_admissions sa
             JOIN shelters s ON s.shelter_id = sa.shelter_id
             WHERE sa.admission_id = ?
             FOR UPDATE`,
            [admission_id]
        );

        if (rows.length === 0) {
            throw new AdmissionError(404, "Admission not found");
        }

        const admission = rows[0];

        if (admission.status !== "ACTIVE") {
            throw new AdmissionError(400, "Only an active admission can be discharged");
        }

        // Shelter managers may discharge only families from shelters assigned to them.
        if (role_id === 2) {
            const [managed] = await connection.query(
                `SELECT id
                 FROM shelter_managers
                 WHERE user_id = ? AND shelter_id = ?
                 LIMIT 1`,
                [user_id, admission.shelter_id]
            );

            if (managed.length === 0) {
                throw new AdmissionError(403, "You cannot manage this shelter");
            }
        }

        // End the shelter stay.
        await connection.query(
            `UPDATE shelter_admissions
             SET status = 'DISCHARGED', discharged_at = CURRENT_TIMESTAMP
             WHERE admission_id = ?`,
            [admission_id]
        );

        // Release the occupied shelter places. Never allow occupancy to go below zero.
        const newOccupancy = Math.max(
            0,
            Number(admission.current_occupancy || 0) - Number(admission.admitted_member_count || 0)
        );

        // A shelter that was FULL becomes OPEN after places are released.
        // Other operational states (DAMAGED, EVACUATING, etc.) are preserved.
        const newOperationalStatus =
            admission.operational_status === "FULL" && newOccupancy < Number(admission.total_capacity)
                ? "OPEN"
                : admission.operational_status;

        await connection.query(
            `UPDATE shelters
             SET current_occupancy = ?, operational_status = ?
             WHERE shelter_id = ?`,
            [newOccupancy, newOperationalStatus, admission.shelter_id]
        );

        // Only mark the family relocated if it has no other active shelter stay.
        const [otherActive] = await connection.query(
            `SELECT admission_id
             FROM shelter_admissions
             WHERE family_id = ? AND status = 'ACTIVE'
             LIMIT 1`,
            [admission.family_id]
        );

        if (otherActive.length === 0) {
            await connection.query(
                `UPDATE families
                 SET status = 'RELOCATED'
                 WHERE family_id = ?`,
                [admission.family_id]
            );
        }

        // The existing DB trigger audits admission creation only, so log discharge here.
        await connection.query(
            `INSERT INTO audit_logs
             (user_id, action_type, entity_type, entity_id, description)
             VALUES (?, 'UPDATE', 'SHELTER_ADMISSION', ?, ?)`,
            [
                user_id,
                admission_id,
                `Family ID ${admission.family_id} discharged from Shelter ID ${admission.shelter_id}`
            ]
        );

        await connection.commit();

        return res.json({
            message: "Family discharged successfully",
            admission_id,
            family_id: admission.family_id,
            shelter_id: admission.shelter_id,
            released_places: Number(admission.admitted_member_count || 0)
        });

    } catch (err) {
        if (connection) {
            await connection.rollback().catch(() => {});
        }

        if (err instanceof AdmissionError) {
            return res.status(err.status).json({ message: err.message });
        }

        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });

    } finally {
        if (connection) connection.release();
    }
};

// =====================================
// GET ALL ADMISSIONS
// =====================================

const getAllAdmissions = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const role_id = req.user.role_id;

        let sql = `
            SELECT
                sa.*,
                s.shelter_name,
                f.family_code,
                f.priority AS family_priority,
                u.full_name AS admitted_by_name
            FROM shelter_admissions sa
            JOIN shelters s
            ON sa.shelter_id = s.shelter_id
            LEFT JOIN families f
            ON sa.family_id = f.family_id
            LEFT JOIN users u
            ON sa.admitted_by = u.user_id
        `;

        const params = [];

        // SHELTER_MANAGER (role 2) can only see admissions
        // for shelters assigned to their own account.
        if (role_id === 2) {
            sql += `
                WHERE sa.shelter_id IN (
                    SELECT sm.shelter_id
                    FROM shelter_managers sm
                    WHERE sm.user_id = ?
                )
            `;
            params.push(user_id);
        }

        sql += ` ORDER BY sa.admitted_at DESC `;

        const [result] = await db.query(sql, params);

        res.json(result);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
    }
};


module.exports = {
    createAdmission,
    dischargeAdmission,
    getAllAdmissions
};
