const db = require("../config/db");


// =================================
// GET ALL VOLUNTEERS
// =================================

const getAllVolunteers = async (req, res) => {
    try {
        const [result] = await db.query(`
            SELECT *
            FROM volunteers
            ORDER BY created_at DESC
        `);
        res.json(result);
    } catch (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// GET AVAILABLE VOLUNTEERS
// =================================

const getAvailableVolunteers = async (req, res) => {
    try {
        const [result] = await db.query(`
            SELECT *
            FROM volunteers
            WHERE availability = 'AVAILABLE'
        `);
        res.json(result);
    } catch (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// GET MY VOLUNTEER PROFILE (VOLUNTEER ACCOUNT)
// Profile is matched by linked user_id, falling back to the account email.
// =================================

const getMyVolunteerProfile = async (req, res) => {
    try {
        const user_id = req.user.user_id;

        const [profiles] = await db.query(
            `
                SELECT v.*
                FROM volunteers v
                LEFT JOIN users u ON u.user_id = ?
                WHERE v.user_id = ?
                   OR (v.user_id IS NULL AND v.email IS NOT NULL AND v.email = u.email)
                ORDER BY (v.user_id = ?) DESC
                LIMIT 1
            `,
            [user_id, user_id, user_id]
        );

        if (profiles.length === 0) {
            return res.json({ volunteer: null, skills: [], assignments: [] });
        }

        const volunteer = profiles[0];

        const [skills] = await db.query(
            `
                SELECT s.*
                FROM volunteer_skills vs
                JOIN skills s ON s.skill_id = vs.skill_id
                WHERE vs.volunteer_id = ?
            `,
            [volunteer.volunteer_id]
        );

        const [assignments] = await db.query(
            `
                SELECT
                    a.assignment_id,
                    a.task_title,
                    a.task_description,
                    a.status,
                    a.assigned_at,
                    a.completed_at,
                    s.shelter_id,
                    s.shelter_name,
                    s.district,
                    s.current_occupancy,
                    s.total_capacity,
                    COALESCE((
                        SELECT SUM(sa1.admitted_member_count)
                        FROM shelter_admissions sa1
                        WHERE sa1.shelter_id = s.shelter_id
                          AND sa1.status = 'ACTIVE'
                          AND NOT EXISTS (
                              SELECT 1
                              FROM shelter_admissions sa2
                              WHERE sa2.shelter_id = sa1.shelter_id
                                AND sa2.family_id = sa1.family_id
                                AND sa2.status = 'ACTIVE'
                                AND sa2.admission_id > sa1.admission_id
                          )
                    ), 0) AS recorded_occupancy,
                    COALESCE((
                        SELECT COUNT(*)
                        FROM shelter_admissions sa1
                        WHERE sa1.shelter_id = s.shelter_id
                          AND sa1.status = 'ACTIVE'
                          AND NOT EXISTS (
                              SELECT 1
                              FROM shelter_admissions sa2
                              WHERE sa2.shelter_id = sa1.shelter_id
                                AND sa2.family_id = sa1.family_id
                                AND sa2.status = 'ACTIVE'
                                AND sa2.admission_id > sa1.admission_id
                          )
                    ), 0) AS active_family_count
                FROM assignments a
                JOIN shelters s ON s.shelter_id = a.shelter_id
                WHERE a.volunteer_id = ?
                ORDER BY a.assigned_at DESC
            `,
            [volunteer.volunteer_id]
        );

        res.json({ volunteer, skills, assignments });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// GET ADMITTED FAMILIES + MEMBERS FOR ONE OF MY SHELTERS
// Volunteer may only inspect shelters that are linked to one of their assignments.
// =================================
const getMyShelterPeople = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const shelter_id = Number(req.params.shelterId);

        if (!shelter_id) {
            return res.status(400).json({ message: "Valid shelter id is required" });
        }

        const [profiles] = await db.query(
            `SELECT volunteer_id FROM volunteers WHERE user_id = ? LIMIT 1`,
            [user_id]
        );

        if (!profiles.length) {
            return res.status(404).json({ message: "Volunteer profile not found" });
        }

        const volunteer_id = profiles[0].volunteer_id;

        const [access] = await db.query(
            `SELECT assignment_id
             FROM assignments
             WHERE volunteer_id = ? AND shelter_id = ?
             LIMIT 1`,
            [volunteer_id, shelter_id]
        );

        if (!access.length) {
            return res.status(403).json({ message: "This shelter is not linked to your assignments" });
        }

        const [shelters] = await db.query(
            `SELECT shelter_id, shelter_name, district, current_occupancy, total_capacity
             FROM shelters
             WHERE shelter_id = ?
             LIMIT 1`,
            [shelter_id]
        );

        if (!shelters.length) {
            return res.status(404).json({ message: "Shelter not found" });
        }

        const [families] = await db.query(
            `SELECT
                f.family_id,
                f.family_code,
                f.contact_phone,
                f.current_district,
                f.current_area,
                f.priority,
                sa.admission_id,
                sa.admitted_member_count,
                sa.admitted_at
             FROM shelter_admissions sa
             JOIN families f ON f.family_id = sa.family_id
             WHERE sa.shelter_id = ?
               AND sa.status = 'ACTIVE'
               AND NOT EXISTS (
                   SELECT 1
                   FROM shelter_admissions newer
                   WHERE newer.shelter_id = sa.shelter_id
                     AND newer.family_id = sa.family_id
                     AND newer.status = 'ACTIVE'
                     AND newer.admission_id > sa.admission_id
               )
             ORDER BY sa.admitted_at DESC`,
            [shelter_id]
        );

        if (!families.length) {
            return res.json({ shelter: { ...shelters[0], recorded_occupancy: 0, active_family_count: 0 }, families: [] });
        }

        const familyIds = families.map((row) => row.family_id);
        const placeholders = familyIds.map(() => '?').join(',');
        const [members] = await db.query(
            `SELECT
                member_id, family_id, full_name, age_years, sex, is_head, relationship_to_head
             FROM family_members
             WHERE family_id IN (${placeholders})
             ORDER BY family_id, is_head DESC, member_id`,
            familyIds
        );

        const byFamily = new Map();
        for (const member of members) {
            if (!byFamily.has(member.family_id)) byFamily.set(member.family_id, []);
            byFamily.get(member.family_id).push(member);
        }

        const recordedOccupancy = families.reduce(
            (sum, family) => sum + (Number(family.admitted_member_count) || 0),
            0
        );

        res.json({
            shelter: {
                ...shelters[0],
                recorded_occupancy: recordedOccupancy,
                active_family_count: families.length
            },
            families: families.map((family) => ({
                ...family,
                members: byFamily.get(family.family_id) || []
            }))
        });
    } catch (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// COMPLETE MY ACTIVE ASSIGNMENT
// Marks the task completed and makes the volunteer available when no active task remains.
// =================================
const completeMyAssignment = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const user_id = req.user.user_id;
        const assignment_id = Number(req.params.assignmentId);

        if (!assignment_id) {
            return res.status(400).json({ message: "Valid assignment id is required" });
        }

        await connection.beginTransaction();

        const [profiles] = await connection.query(
            `SELECT volunteer_id FROM volunteers WHERE user_id = ? LIMIT 1 FOR UPDATE`,
            [user_id]
        );

        if (!profiles.length) {
            await connection.rollback();
            return res.status(404).json({ message: "Volunteer profile not found" });
        }

        const volunteer_id = profiles[0].volunteer_id;

        const [rows] = await connection.query(
            `SELECT assignment_id, status
             FROM assignments
             WHERE assignment_id = ? AND volunteer_id = ?
             FOR UPDATE`,
            [assignment_id, volunteer_id]
        );

        if (!rows.length) {
            await connection.rollback();
            return res.status(404).json({ message: "Assignment not found" });
        }

        if (rows[0].status !== 'ACTIVE') {
            await connection.rollback();
            return res.status(400).json({ message: "Only an active assignment can be completed" });
        }

        await connection.query(
            `UPDATE assignments
             SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP
             WHERE assignment_id = ?`,
            [assignment_id]
        );

        const [active] = await connection.query(
            `SELECT assignment_id
             FROM assignments
             WHERE volunteer_id = ? AND status = 'ACTIVE'
             LIMIT 1`,
            [volunteer_id]
        );

        if (!active.length) {
            await connection.query(
                `UPDATE volunteers SET availability = 'AVAILABLE' WHERE volunteer_id = ?`,
                [volunteer_id]
            );
        }

        await connection.commit();
        return res.json({ message: "Assignment marked as completed" });
    } catch (err) {
        try { await connection.rollback(); } catch (_) { /* no-op */ }
        return res.status(500).json({ message: "Database error", error: err.message });
    } finally {
        connection.release();
    }
};


// =================================
// ADD VOLUNTEER
// =================================

const createVolunteer = async (req, res) => {
    try {
        const { volunteer_code, volunteer_name, phone, email } = req.body;

        const [result] = await db.query(
            `
                INSERT INTO volunteers (volunteer_code, volunteer_name, phone, email)
                VALUES (?, ?, ?, ?)
            `,
            [volunteer_code, volunteer_name, phone, email]
        );

        res.json({
            message: "Volunteer added successfully",
            volunteer_id: result.insertId
        });
    } catch (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// UPDATE VOLUNTEER
// =================================

const updateVolunteer = async (req, res) => {
    try {
        const { id } = req.params;
        const { volunteer_name, phone, email, availability } = req.body;

        await db.query(
            `
                UPDATE volunteers
                SET volunteer_name = ?, phone = ?, email = ?, availability = ?
                WHERE volunteer_id = ?
            `,
            [volunteer_name, phone, email, availability, id]
        );

        res.json({ message: "Volunteer updated successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// DELETE VOLUNTEER
// =================================

const deleteVolunteer = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`DELETE FROM volunteers WHERE volunteer_id = ?`, [id]);
        res.json({ message: "Volunteer deleted successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Database error" });
    }
};


// =================================
// ADD SKILL TO VOLUNTEER
// =================================

const addVolunteerSkill = async (req, res) => {
    try {
        const { volunteer_id, skill_id } = req.body;

        const [existing] = await db.query(
            `
                SELECT *
                FROM volunteer_skills
                WHERE volunteer_id = ? AND skill_id = ?
            `,
            [volunteer_id, skill_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Skill already assigned" });
        }

        await db.query(
            `INSERT INTO volunteer_skills (volunteer_id, skill_id) VALUES (?, ?)`,
            [volunteer_id, skill_id]
        );

        res.json({ message: "Skill assigned successfully" });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "Skill already assigned" });
        }
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// REMOVE VOLUNTEER SKILL
// =================================

const removeVolunteerSkill = async (req, res) => {
    try {
        const { volunteer_id, skill_id } = req.body;

        await db.query(
            `DELETE FROM volunteer_skills WHERE volunteer_id = ? AND skill_id = ?`,
            [volunteer_id, skill_id]
        );

        res.json({ message: "Skill removed successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Database error" });
    }
};



// =================================
// GET VOLUNTEERS WITH SKILLS + ACTIVE ASSIGNMENT
// =================================
const getVolunteerDirectory = async (req, res) => {
    try {
        const [result] = await db.query(`
            SELECT
                v.*,
                u.status AS account_status,
                GROUP_CONCAT(DISTINCT s.skill_name ORDER BY s.skill_name SEPARATOR ', ') AS skills,
                MAX(CASE WHEN a.status = 'ACTIVE' THEN a.assignment_id END) AS active_assignment_id,
                MAX(CASE WHEN a.status = 'ACTIVE' THEN a.task_title END) AS active_task,
                MAX(CASE WHEN a.status = 'ACTIVE' THEN sh.shelter_name END) AS assigned_shelter
            FROM volunteers v
            LEFT JOIN users u ON u.user_id = v.user_id
            LEFT JOIN volunteer_skills vs ON vs.volunteer_id = v.volunteer_id
            LEFT JOIN skills s ON s.skill_id = vs.skill_id
            LEFT JOIN assignments a ON a.volunteer_id = v.volunteer_id AND a.status = 'ACTIVE'
            LEFT JOIN shelters sh ON sh.shelter_id = a.shelter_id
            GROUP BY v.volunteer_id, u.status
            ORDER BY
                CASE WHEN u.status = 'INACTIVE' THEN 0 ELSE 1 END,
                v.created_at DESC
        `);
        res.json(result);
    } catch (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// APPROVE SELF-REGISTERED VOLUNTEER (ADMIN ONLY)
// =================================
const approveVolunteer = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const volunteer_id = Number(req.params.id);

        if (!volunteer_id) {
            return res.status(400).json({ message: "Valid volunteer id is required" });
        }

        await connection.beginTransaction();

        const [rows] = await connection.query(
            `SELECT volunteer_id, user_id, availability
             FROM volunteers
             WHERE volunteer_id = ?
             FOR UPDATE`,
            [volunteer_id]
        );

        if (!rows.length) {
            await connection.rollback();
            return res.status(404).json({ message: "Volunteer not found" });
        }

        const volunteer = rows[0];

        if (!volunteer.user_id) {
            await connection.rollback();
            return res.status(400).json({ message: "This volunteer is not linked to a user account" });
        }

        const [users] = await connection.query(
            `SELECT user_id, role_id, status FROM users WHERE user_id = ? FOR UPDATE`,
            [volunteer.user_id]
        );

        if (!users.length || Number(users[0].role_id) !== 4) {
            await connection.rollback();
            return res.status(400).json({ message: "Linked volunteer account not found" });
        }

        await connection.query(
            `UPDATE users SET status = 'ACTIVE' WHERE user_id = ?`,
            [volunteer.user_id]
        );

        await connection.query(
            `UPDATE volunteers SET availability = 'AVAILABLE' WHERE volunteer_id = ?`,
            [volunteer_id]
        );

        await connection.commit();

        return res.json({ message: "Volunteer approved successfully" });
    } catch (err) {
        try { await connection.rollback(); } catch (_) { /* no-op */ }
        return res.status(500).json({ message: "Database error", error: err.message });
    } finally {
        connection.release();
    }
};


// =================================
// ASSIGN VOLUNTEER TO A SHELTER TASK
// =================================
const assignVolunteer = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const volunteer_id = Number(req.params.id);
        const { shelter_id, task_title, task_description } = req.body;
        const assigned_by = req.user.user_id;

        if (!volunteer_id || !shelter_id || !task_title?.trim()) {
            return res.status(400).json({ message: "Volunteer, shelter and task title are required" });
        }

        await connection.beginTransaction();

        const [volunteers] = await connection.query(
            `SELECT v.volunteer_id, v.availability, v.user_id, u.status AS account_status
             FROM volunteers v
             LEFT JOIN users u ON u.user_id = v.user_id
             WHERE v.volunteer_id = ?
             FOR UPDATE`,
            [volunteer_id]
        );
        if (!volunteers.length) {
            await connection.rollback();
            return res.status(404).json({ message: "Volunteer not found" });
        }
        if (volunteers[0].user_id && volunteers[0].account_status !== 'ACTIVE') {
            await connection.rollback();
            return res.status(400).json({ message: "Volunteer must be approved before assignment" });
        }
        if (volunteers[0].availability !== 'AVAILABLE') {
            await connection.rollback();
            return res.status(400).json({ message: "Volunteer is not currently available" });
        }

        const [active] = await connection.query(
            `SELECT assignment_id FROM assignments WHERE volunteer_id = ? AND status = 'ACTIVE' LIMIT 1`,
            [volunteer_id]
        );
        if (active.length) {
            await connection.rollback();
            return res.status(400).json({ message: "Volunteer already has an active assignment" });
        }

        const [shelter] = await connection.query(`SELECT shelter_id FROM shelters WHERE shelter_id = ?`, [shelter_id]);
        if (!shelter.length) {
            await connection.rollback();
            return res.status(404).json({ message: "Shelter not found" });
        }

        const [result] = await connection.query(
            `INSERT INTO assignments (volunteer_id, shelter_id, task_title, task_description, assigned_by)
             VALUES (?, ?, ?, ?, ?)`,
            [volunteer_id, shelter_id, task_title.trim(), task_description?.trim() || null, assigned_by]
        );

        await connection.query(`UPDATE volunteers SET availability = 'BUSY' WHERE volunteer_id = ?`, [volunteer_id]);
        await connection.commit();

        res.status(201).json({ message: "Volunteer assigned successfully", assignment_id: result.insertId });
    } catch (err) {
        await connection.rollback();
        return res.status(500).json({ message: "Database error", error: err.message });
    } finally {
        connection.release();
    }
};



// =================================
// GET SKILL CATALOG (VOLUNTEER)
// =================================
const getSkillCatalog = async (req, res) => {
    try {
        const [skills] = await db.query(`
            SELECT skill_id, skill_name, description
            FROM skills
            ORDER BY skill_name
        `);
        res.json(skills);
    } catch (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// UPDATE MY VOLUNTEER SKILLS
// Replaces the current volunteer's selected skills atomically.
// =================================
const updateMySkills = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const user_id = req.user.user_id;
        const rawSkillIds = Array.isArray(req.body.skill_ids) ? req.body.skill_ids : [];
        const skillIds = [...new Set(rawSkillIds.map(Number).filter(Number.isInteger))];

        await connection.beginTransaction();

        const [profiles] = await connection.query(
            `SELECT volunteer_id FROM volunteers WHERE user_id = ? LIMIT 1 FOR UPDATE`,
            [user_id]
        );

        if (!profiles.length) {
            await connection.rollback();
            return res.status(404).json({ message: "Volunteer profile not found" });
        }

        const volunteer_id = profiles[0].volunteer_id;

        if (skillIds.length) {
            const placeholders = skillIds.map(() => '?').join(',');
            const [validSkills] = await connection.query(
                `SELECT skill_id FROM skills WHERE skill_id IN (${placeholders})`,
                skillIds
            );
            const validIds = new Set(validSkills.map((row) => Number(row.skill_id)));
            const invalid = skillIds.filter((id) => !validIds.has(id));

            if (invalid.length) {
                await connection.rollback();
                return res.status(400).json({ message: "One or more selected skills are invalid" });
            }
        }

        await connection.query(
            `DELETE FROM volunteer_skills WHERE volunteer_id = ?`,
            [volunteer_id]
        );

        for (const skill_id of skillIds) {
            await connection.query(
                `INSERT INTO volunteer_skills (volunteer_id, skill_id) VALUES (?, ?)`,
                [volunteer_id, skill_id]
            );
        }

        const [skills] = await connection.query(
            `SELECT s.skill_id, s.skill_name, s.description
             FROM volunteer_skills vs
             JOIN skills s ON s.skill_id = vs.skill_id
             WHERE vs.volunteer_id = ?
             ORDER BY s.skill_name`,
            [volunteer_id]
        );

        await connection.commit();
        res.json({ message: "Skills updated successfully", skills });
    } catch (err) {
        await connection.rollback();
        return res.status(500).json({ message: "Database error", error: err.message });
    } finally {
        connection.release();
    }
};
module.exports = {
    getAllVolunteers,
    getVolunteerDirectory,
    approveVolunteer,
    assignVolunteer,
    getAvailableVolunteers,
    getMyVolunteerProfile,
    getMyShelterPeople,
    completeMyAssignment,
    createVolunteer,
    updateVolunteer,
    deleteVolunteer,
    addVolunteerSkill,
    removeVolunteerSkill,
    getSkillCatalog,
    updateMySkills
};
