const db = require("../config/db");

// Business-rule errors carry their own HTTP status
class MedicalError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const handleError = (res, err) => {
    if (err instanceof MedicalError) {
        return res.status(err.status).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ message: "Database error", error: err.message });
};


const MEDICAL_TEAM_CASE_LIMIT = 5;

// Keep a team's stored availability in sync with its active workload.
// OFFLINE is a manual state and is never overridden automatically.
const syncMedicalTeamAvailability = async (connection, medicalTeamId) => {
    if (!medicalTeamId) return;

    const [[team]] = await connection.query(
        `SELECT availability FROM medical_teams WHERE medical_team_id = ?`,
        [medicalTeamId]
    );
    if (!team || team.availability === "OFFLINE") return;

    const [[load]] = await connection.query(
        `SELECT COUNT(*) AS active_cases
         FROM medical_assignments ma
         JOIN medical_requests mr ON mr.medical_request_id = ma.medical_request_id
         WHERE ma.medical_team_id = ?
           AND ma.status = 'ASSIGNED'
           AND mr.status = 'ASSIGNED'`,
        [medicalTeamId]
    );

    const nextAvailability = Number(load.active_cases) >= MEDICAL_TEAM_CASE_LIMIT ? "BUSY" : "AVAILABLE";
    await connection.query(
        `UPDATE medical_teams SET availability = ? WHERE medical_team_id = ?`,
        [nextAvailability, medicalTeamId]
    );
};

// =================================
// GET ALL MEDICAL TEAMS
// =================================

const getMedicalTeams = async (req, res) => {

    try {
        const [result] = await db.query(`
            SELECT
                mt.*,
                COUNT(CASE
                    WHEN ma.status = 'ASSIGNED' AND mr.status = 'ASSIGNED' THEN 1
                    ELSE NULL
                END) AS active_case_count,
                CASE
                    WHEN mt.availability = 'OFFLINE' THEN 'OFFLINE'
                    WHEN COUNT(CASE WHEN ma.status = 'ASSIGNED' AND mr.status = 'ASSIGNED' THEN 1 ELSE NULL END) >= ${MEDICAL_TEAM_CASE_LIMIT}
                        THEN 'BUSY'
                    ELSE 'AVAILABLE'
                END AS availability
            FROM medical_teams mt
            LEFT JOIN medical_assignments ma ON ma.medical_team_id = mt.medical_team_id
            LEFT JOIN medical_requests mr ON mr.medical_request_id = ma.medical_request_id
            GROUP BY mt.medical_team_id
            ORDER BY mt.name
        `);
        res.json(result);
    } catch (err) {
        return handleError(res, err);
    }

};


// =================================
// CREATE MEDICAL TEAM (ADMIN ONLY)
// =================================

const createMedicalTeam = async (req, res) => {
    let connection;

    try {
        const { name, role, phone, location, availability = "AVAILABLE" } = req.body;

        if (!name || !role) {
            return res.status(400).json({ message: "Name and role are required" });
        }

        const allowedRoles = ["DOCTOR", "NURSE", "MEDICAL_VOLUNTEER"];
        const allowedAvailability = ["AVAILABLE", "BUSY", "OFFLINE"];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid medical team role" });
        }
        if (!allowedAvailability.includes(availability)) {
            return res.status(400).json({ message: "Invalid availability status" });
        }

        const cleanName = String(name).trim();
        if (!cleanName) {
            return res.status(400).json({ message: "Name is required" });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO medical_teams (name, role, phone, location, availability)
             VALUES (?, ?, ?, ?, ?)`,
            [cleanName, role, phone?.trim() || null, location?.trim() || null, availability]
        );

        // Keep Medical Team creation visible in the central Audit Log.
        await connection.query(
            `INSERT INTO audit_logs
                (user_id, action_type, entity_type, entity_id, description)
             VALUES (?, 'INSERT', 'MEDICAL_TEAM', ?, ?)`,
            [
                req.user?.user_id || null,
                result.insertId,
                `Medical team ${cleanName} created as ${role.replaceAll("_", " ")}`
            ]
        );

        const [created] = await connection.query(
            `SELECT * FROM medical_teams WHERE medical_team_id = ?`,
            [result.insertId]
        );

        await connection.commit();

        return res.status(201).json({
            message: "Medical team added successfully",
            medical_team: created[0]
        });
    } catch (err) {
        if (connection) await connection.rollback().catch(() => {});
        return handleError(res, err);
    } finally {
        if (connection) connection.release();
    }
};

// =================================
// CREATE MEDICAL REQUEST
// =================================

const createMedicalRequest = async (req, res) => {

    try {

        const { family_id, problem_description, priority } = req.body;

        if (!family_id || !problem_description || !priority) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        if (!["LOW", "MEDIUM", "HIGH", "EMERGENCY"].includes(priority)) {
            return res.status(400).json({ message: "Invalid priority" });
        }

        const [family] = await db.query(`SELECT family_id FROM families WHERE family_id = ?`, [family_id]);
        if (family.length === 0) {
            return res.status(404).json({ message: "Family not found" });
        }

        const [result] = await db.query(
            `INSERT INTO medical_requests (family_id, problem_description, priority) VALUES (?, ?, ?)`,
            [family_id, problem_description.trim(), priority]
        );

        res.status(201).json({
            message: "Medical request created successfully",
            medical_request_id: result.insertId
        });

    } catch (err) {
        return handleError(res, err);
    }

};


// =================================
// ASSIGN MEDICAL SUPPORT
// (one assignment per request; assigning again replaces the team / volunteer)
// =================================

const assignMedicalSupport = async (req, res) => {

    const { medical_request_id, medical_team_id, volunteer_id } = req.body;

    if (!medical_request_id || (!medical_team_id && !volunteer_id)) {
        return res.status(400).json({ message: "Select a medical team or a volunteer" });
    }

    let connection;

    try {

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [requests] = await connection.query(
            `SELECT medical_request_id, status FROM medical_requests WHERE medical_request_id = ? FOR UPDATE`,
            [medical_request_id]
        );
        if (requests.length === 0) {
            throw new MedicalError(404, "Medical request not found");
        }
        if (requests[0].status === "COMPLETED") {
            throw new MedicalError(400, "This request is already completed");
        }

        const [existing] = await connection.query(
            `SELECT assignment_id, volunteer_id, medical_team_id
             FROM medical_assignments
             WHERE medical_request_id = ?`,
            [medical_request_id]
        );
        const previousVolunteer = existing.length > 0 ? existing[0].volunteer_id : null;
        const previousMedicalTeam = existing.length > 0 ? existing[0].medical_team_id : null;

        if (medical_team_id) {
            const [team] = await connection.query(
                `SELECT medical_team_id, availability
                 FROM medical_teams
                 WHERE medical_team_id = ?
                 FOR UPDATE`,
                [medical_team_id]
            );
            if (team.length === 0) {
                throw new MedicalError(404, "Medical team not found");
            }
            if (team[0].availability === "OFFLINE") {
                throw new MedicalError(400, "Medical team is offline");
            }

            // A team may handle at most 5 active cases at once.
            // Re-saving the same request to the same team does not consume another slot.
            if (Number(medical_team_id) !== Number(previousMedicalTeam)) {
                const [[load]] = await connection.query(
                    `SELECT COUNT(*) AS active_cases
                     FROM medical_assignments ma
                     JOIN medical_requests mr ON mr.medical_request_id = ma.medical_request_id
                     WHERE ma.medical_team_id = ?
                       AND ma.status = 'ASSIGNED'
                       AND mr.status = 'ASSIGNED'`,
                    [medical_team_id]
                );
                if (Number(load.active_cases) >= MEDICAL_TEAM_CASE_LIMIT) {
                    throw new MedicalError(400, `This medical team already has ${MEDICAL_TEAM_CASE_LIMIT} active cases and is busy`);
                }
            }
        }

        if (volunteer_id && Number(volunteer_id) !== Number(previousVolunteer)) {
            const [vol] = await connection.query(`SELECT availability FROM volunteers WHERE volunteer_id = ?`, [volunteer_id]);
            if (vol.length === 0) {
                throw new MedicalError(404, "Volunteer not found");
            }
            if (vol[0].availability !== "AVAILABLE") {
                throw new MedicalError(400, "Volunteer is not available");
            }
        }

        let assignment_id;

        if (existing.length > 0) {
            assignment_id = existing[0].assignment_id;
            await connection.query(
                `UPDATE medical_assignments
                 SET medical_team_id = ?, volunteer_id = ?, status = 'ASSIGNED', assigned_at = NOW()
                 WHERE assignment_id = ?`,
                [medical_team_id || null, volunteer_id || null, assignment_id]
            );
        } else {
            const [inserted] = await connection.query(
                `INSERT INTO medical_assignments (medical_request_id, medical_team_id, volunteer_id) VALUES (?, ?, ?)`,
                [medical_request_id, medical_team_id || null, volunteer_id || null]
            );
            assignment_id = inserted.insertId;
        }

        // Free the old volunteer, lock the new one
        if (previousVolunteer && Number(previousVolunteer) !== Number(volunteer_id)) {
            await connection.query(`UPDATE volunteers SET availability = 'AVAILABLE' WHERE volunteer_id = ?`, [previousVolunteer]);
        }
        if (volunteer_id) {
            await connection.query(`UPDATE volunteers SET availability = 'BUSY' WHERE volunteer_id = ?`, [volunteer_id]);
        }

        await connection.query(`UPDATE medical_requests SET status = 'ASSIGNED' WHERE medical_request_id = ?`, [medical_request_id]);

        if (previousMedicalTeam && Number(previousMedicalTeam) !== Number(medical_team_id)) {
            await syncMedicalTeamAvailability(connection, previousMedicalTeam);
        }
        if (medical_team_id) {
            await syncMedicalTeamAvailability(connection, medical_team_id);
        }

        await connection.commit();

        res.json({ message: "Medical support assigned successfully", assignment_id });

    } catch (err) {
        if (connection) await connection.rollback().catch(() => {});
        return handleError(res, err);
    } finally {
        if (connection) connection.release();
    }

};


// =================================
// GET ALL MEDICAL REQUESTS (WITH ASSIGNMENT HISTORY)
// =================================

const getMedicalRequests = async (req, res) => {

    try {

        const [result] = await db.query(`
            SELECT
                mr.medical_request_id,
                mr.family_id,
                mr.problem_description,
                mr.priority,
                mr.status,
                mr.requested_at,
                f.family_code,
                f.current_district,
                ma.assignment_id,
                ma.assigned_at,
                ma.status AS assignment_status,
                ma.medical_team_id,
                mt.name AS assigned_medical_team,
                mt.role AS team_role,
                mt.phone AS team_phone,
                ma.volunteer_id,
                v.volunteer_name AS assigned_volunteer,
                v.volunteer_code,
                v.phone AS volunteer_phone
            FROM medical_requests mr
            JOIN families f ON mr.family_id = f.family_id
            LEFT JOIN medical_assignments ma ON mr.medical_request_id = ma.medical_request_id
            LEFT JOIN medical_teams mt ON ma.medical_team_id = mt.medical_team_id
            LEFT JOIN volunteers v ON ma.volunteer_id = v.volunteer_id
            ORDER BY mr.requested_at DESC, mr.medical_request_id DESC
        `);

        res.json(result);

    } catch (err) {
        return handleError(res, err);
    }

};


// =================================
// UPDATE MEDICAL ASSIGNMENT STATUS
// =================================

const updateMedicalAssignmentStatus = async (req, res) => {

    const { assignment_id, status } = req.body;

    if (!assignment_id || !["ASSIGNED", "COMPLETED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    let connection;

    try {

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.query(
            `SELECT assignment_id, medical_request_id, volunteer_id, medical_team_id FROM medical_assignments WHERE assignment_id = ? FOR UPDATE`,
            [assignment_id]
        );
        if (rows.length === 0) {
            throw new MedicalError(404, "Assignment not found");
        }
        const assignment = rows[0];

        await connection.query(`UPDATE medical_assignments SET status = ? WHERE assignment_id = ?`, [status, assignment_id]);
        await connection.query(`UPDATE medical_requests SET status = ? WHERE medical_request_id = ?`, [status, assignment.medical_request_id]);

        // Completed work frees the volunteer again
        if (status === "COMPLETED" && assignment.volunteer_id) {
            await connection.query(`UPDATE volunteers SET availability = 'AVAILABLE' WHERE volunteer_id = ?`, [assignment.volunteer_id]);
        }
        if (assignment.medical_team_id) {
            await syncMedicalTeamAvailability(connection, assignment.medical_team_id);
        }

        await connection.commit();

        res.json({ message: "Medical assignment status updated" });

    } catch (err) {
        if (connection) await connection.rollback().catch(() => {});
        return handleError(res, err);
    } finally {
        if (connection) connection.release();
    }

};


// =================================
// FIND VOLUNTEER BY SKILL
// =================================

const findVolunteerBySkill = async (req, res) => {

    try {

        const { skill_name } = req.query;

        const [result] = await db.query(
            `
                SELECT
                    v.volunteer_id,
                    v.volunteer_code,
                    v.volunteer_name,
                    v.phone,
                    v.availability,
                    s.skill_name
                FROM volunteers v
                JOIN volunteer_skills vs ON v.volunteer_id = vs.volunteer_id
                JOIN skills s ON vs.skill_id = s.skill_id
                WHERE s.skill_name = ?
                AND v.availability = 'AVAILABLE'
            `,
            [skill_name]
        );

        res.json(result);

    } catch (err) {
        return handleError(res, err);
    }

};


module.exports = {
    getMedicalTeams,
    createMedicalTeam,
    createMedicalRequest,
    assignMedicalSupport,
    getMedicalRequests,
    updateMedicalAssignmentStatus,
    findVolunteerBySkill
};
