const db = require("../config/db");


// =================================
// GET ALL FAMILIES
// =================================

const getAllFamilies = async (req, res) => {
    try {
        const sql = `
            SELECT
                family_id,
                family_code,
                contact_phone,
                current_district,
                current_area,
                priority,
                status,
                registered_by,
                registered_at,
                (SELECT COUNT(*) FROM family_members fm WHERE fm.family_id = families.family_id) AS member_count
            FROM families
            ORDER BY registered_at DESC
        `;
        const [result] = await db.query(sql);
        res.json(result);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Database error" });
    }
};


// =================================
// CREATE FAMILY
// =================================

const createFamily = async (req, res) => {
    try {
        const {
            family_code,
            contact_phone,
            current_district,
            current_area,
            priority
        } = req.body;

        const registered_by = req.user.user_id;

        // REQUIRED FIELD VALIDATION
        if (
            !family_code ||
            !contact_phone ||
            !current_district ||
            !current_area ||
            !priority
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const cleanFamilyCode = family_code.trim();

        // PRIORITY VALIDATION
        const allowedPriority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
        if (!allowedPriority.includes(priority)) {
            return res.status(400).json({ message: "Invalid priority" });
        }

        // CHECK DUPLICATE FAMILY CODE
        const checkSql = `SELECT family_id FROM families WHERE family_code = ?`;
        const [existing] = await db.query(checkSql, [cleanFamilyCode]);

        if (existing.length > 0) {
            return res.status(400).json({ message: "Family already registered" });
        }

        // INSERT FAMILY
        const insertSql = `
            INSERT INTO families
            (
                family_code,
                contact_phone,
                current_district,
                current_area,
                priority,
                registered_by
            )
            VALUES (?,?,?,?,?,?)
        `;

        const [result] = await db.query(
            insertSql,
            [
                cleanFamilyCode,
                contact_phone,
                current_district,
                current_area,
                priority,
                registered_by
            ]
        );

        res.status(201).json({
            message: "Family registered successfully",
            family_id: result.insertId,
            registered_by
        });

    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "Family already registered" });
        }
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};



// =================================
// GET FAMILY MEMBERS
// =================================

const getFamilyMembers = async (req, res) => {

    try {

        const { id } = req.params;

        const [result] = await db.query(
            `
                SELECT
                    member_id,
                    family_id,
                    full_name,
                    age_years,
                    sex,
                    is_head,
                    relationship_to_head,
                    created_at
                FROM family_members
                WHERE family_id = ?
                ORDER BY is_head DESC, member_id ASC
            `,
            [id]
        );

        res.json(result);

    } catch (err) {

        console.error(err);
        return res.status(500).json({ message: "Database error" });

    }

};




// =================================
// GET FAMILY MEMBER CAPACITY
// =================================

const getFamilyMemberCapacity = async (req, res) => {
    try {
        const { id } = req.params;

        const [family] = await db.query(
            `SELECT family_id, family_code FROM families WHERE family_id = ?`,
            [id]
        );

        if (family.length === 0) {
            return res.status(404).json({ message: "Family not found" });
        }

        const [admissionRows] = await db.query(
            `
                SELECT admitted_member_count
                FROM shelter_admissions
                WHERE family_id = ? AND status = 'ACTIVE'
                ORDER BY admitted_at DESC, admission_id DESC
                LIMIT 1
            `,
            [id]
        );

        const [memberRows] = await db.query(
            `SELECT COUNT(*) AS recorded_member_count FROM family_members WHERE family_id = ?`,
            [id]
        );

        const admittedMemberCount = admissionRows.length
            ? Number(admissionRows[0].admitted_member_count || 0)
            : 0;
        const recordedMemberCount = Number(memberRows[0]?.recorded_member_count || 0);
        const remainingSlots = Math.max(admittedMemberCount - recordedMemberCount, 0);

        return res.json({
            family_id: Number(id),
            admitted_member_count: admittedMemberCount,
            recorded_member_count: recordedMemberCount,
            remaining_slots: remainingSlots,
            has_active_admission: admissionRows.length > 0,
            can_add_member: admissionRows.length > 0 && remainingSlots > 0
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};

// =================================
// ADD FAMILY MEMBER
// =================================

const addFamilyMember = async (req, res) => {

    let connection;

    try {

        const { id } = req.params;

        const {
            full_name,
            age_years,
            sex,
            is_head,
            relationship_to_head
        } = req.body;

        const name = (full_name || "").trim();

        if (!name) {
            return res.status(400).json({ message: "Member name is required" });
        }

        const allowedSex = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];

        if (sex && !allowedSex.includes(sex)) {
            return res.status(400).json({ message: "Invalid sex value" });
        }

        let age = null;

        if (age_years !== undefined && age_years !== null && age_years !== "") {
            age = Number(age_years);
            if (!Number.isInteger(age) || age < 0 || age > 120) {
                return res.status(400).json({ message: "Age must be between 0 and 120" });
            }
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Lock the family so simultaneous member additions cannot exceed the admission limit.
        const [family] = await connection.query(
            `SELECT family_id FROM families WHERE family_id = ? FOR UPDATE`,
            [id]
        );

        if (family.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Family not found" });
        }

        // A family member may only be recorded up to the member count of the family's ACTIVE admission.
        const [admissionRows] = await connection.query(
            `
                SELECT admission_id, admitted_member_count
                FROM shelter_admissions
                WHERE family_id = ? AND status = 'ACTIVE'
                ORDER BY admitted_at DESC, admission_id DESC
                LIMIT 1
                FOR UPDATE
            `,
            [id]
        );

        if (admissionRows.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                message: "Admit this family to a shelter before adding members"
            });
        }

        const admittedMemberCount = Number(admissionRows[0].admitted_member_count || 0);

        const [countRows] = await connection.query(
            `SELECT COUNT(*) AS member_count FROM family_members WHERE family_id = ?`,
            [id]
        );
        const memberCount = Number(countRows[0]?.member_count || 0);

        if (memberCount >= admittedMemberCount) {
            await connection.rollback();
            return res.status(400).json({
                message: `Member limit reached. This admission allows ${admittedMemberCount} member${admittedMemberCount === 1 ? "" : "s"}.`
            });
        }

        // ONLY ONE HEAD PER FAMILY
        const head = is_head === true || is_head === 1 || is_head === "1";

        if (head) {
            const [existingHead] = await connection.query(
                `SELECT member_id FROM family_members WHERE family_id = ? AND is_head = 1 LIMIT 1`,
                [id]
            );
            if (existingHead.length > 0) {
                await connection.rollback();
                return res.status(400).json({ message: "This family already has a head" });
            }
        }

        const [result] = await connection.query(
            `
                INSERT INTO family_members
                (family_id, full_name, age_years, sex, is_head, relationship_to_head)
                VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                id,
                name,
                age,
                sex || null,
                head ? 1 : 0,
                head ? "HEAD" : ((relationship_to_head || "").trim() || null)
            ]
        );

        await connection.commit();

        const newMemberCount = memberCount + 1;

        return res.status(201).json({
            message: "Family member added successfully",
            member_id: result.insertId,
            admitted_member_count: admittedMemberCount,
            recorded_member_count: newMemberCount,
            remaining_slots: Math.max(admittedMemberCount - newMemberCount, 0)
        });

    } catch (err) {

        if (connection) {
            await connection.rollback().catch(() => {});
        }

        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });

    } finally {
        if (connection) connection.release();
    }

};



// =================================
// REMOVE ONE FAMILY MEMBER (ADMIN)
// The person leaves the shelter, so the active admission and the shelter
// occupancy shrink by one. If they were the last admitted person the
// admission is closed and the family is marked relocated.
// =================================

const removeFamilyMember = async (req, res) => {
    const family_id = Number(req.params.id);
    const member_id = Number(req.params.memberId);

    if (!Number.isInteger(family_id) || !Number.isInteger(member_id)) {
        return res.status(400).json({ message: "Valid family and member ids are required" });
    }

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [members] = await connection.query(
            `SELECT member_id, full_name, is_head FROM family_members WHERE member_id = ? AND family_id = ? FOR UPDATE`,
            [member_id, family_id]
        );
        if (members.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Family member not found" });
        }

        await connection.query(`DELETE FROM family_members WHERE member_id = ?`, [member_id]);

        let released = 0;
        let admissionClosed = false;

        const [admissions] = await connection.query(
            `SELECT admission_id, shelter_id, admitted_member_count
             FROM shelter_admissions
             WHERE family_id = ? AND status = 'ACTIVE'
             ORDER BY admission_id DESC LIMIT 1 FOR UPDATE`,
            [family_id]
        );

        if (admissions.length > 0) {
            const adm = admissions[0];
            released = 1;

            if (Number(adm.admitted_member_count) <= 1) {
                admissionClosed = true;
                await connection.query(
                    `UPDATE shelter_admissions SET admitted_member_count = 0, status = 'DISCHARGED', discharged_at = CURRENT_TIMESTAMP WHERE admission_id = ?`,
                    [adm.admission_id]
                );
                await connection.query(`UPDATE families SET status = 'RELOCATED' WHERE family_id = ?`, [family_id]);
            } else {
                await connection.query(
                    `UPDATE shelter_admissions SET admitted_member_count = admitted_member_count - 1 WHERE admission_id = ?`,
                    [adm.admission_id]
                );
            }

            await connection.query(
                `UPDATE shelters
                 SET current_occupancy = GREATEST(current_occupancy - 1, 0),
                     operational_status = IF(operational_status = 'FULL', 'OPEN', operational_status)
                 WHERE shelter_id = ?`,
                [adm.shelter_id]
            );
        }

        await connection.query(
            `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
             VALUES (?, 'DELETE', 'FAMILY_MEMBER', ?, ?)`,
            [req.user.user_id, member_id, `Member "${members[0].full_name}" removed from family ID ${family_id} by administrator`]
        );

        await connection.commit();

        res.json({
            message: "Family member removed successfully",
            released_places: released,
            admission_closed: admissionClosed
        });

    } catch (err) {
        if (connection) await connection.rollback().catch(() => {});
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    } finally {
        if (connection) connection.release();
    }
};


// =================================
// REMOVE A WHOLE FAMILY (ADMIN)
// Releases any occupied shelter places, then deletes the family with its
// members, admissions and medical requests.
// =================================

const removeFamily = async (req, res) => {
    const family_id = Number(req.params.id);

    if (!Number.isInteger(family_id) || family_id < 1) {
        return res.status(400).json({ message: "Valid family id is required" });
    }

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [families] = await connection.query(
            `SELECT family_id, family_code FROM families WHERE family_id = ? FOR UPDATE`,
            [family_id]
        );
        if (families.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Family not found" });
        }

        // Give back the places this family still occupies
        const [active] = await connection.query(
            `SELECT shelter_id, SUM(admitted_member_count) AS people
             FROM shelter_admissions
             WHERE family_id = ? AND status = 'ACTIVE'
             GROUP BY shelter_id`,
            [family_id]
        );

        let released = 0;
        for (const row of active) {
            const people = Number(row.people) || 0;
            released += people;
            await connection.query(
                `UPDATE shelters
                 SET current_occupancy = GREATEST(current_occupancy - ?, 0),
                     operational_status = IF(operational_status = 'FULL', 'OPEN', operational_status)
                 WHERE shelter_id = ?`,
                [people, row.shelter_id]
            );
        }

        // Admissions have no ON DELETE CASCADE, members and medical requests do
        await connection.query(`DELETE FROM shelter_admissions WHERE family_id = ?`, [family_id]);
        await connection.query(`DELETE FROM families WHERE family_id = ?`, [family_id]);

        await connection.query(
            `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
             VALUES (?, 'DELETE', 'FAMILY', ?, ?)`,
            [req.user.user_id, family_id, `Family ${families[0].family_code} (ID ${family_id}) removed by administrator`]
        );

        await connection.commit();

        res.json({ message: "Family removed successfully", released_places: released });

    } catch (err) {
        if (connection) await connection.rollback().catch(() => {});
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    } finally {
        if (connection) connection.release();
    }
};


module.exports = {
    getAllFamilies,
    createFamily,
    getFamilyMembers,
    getFamilyMemberCapacity,
    addFamilyMember,
    removeFamilyMember,
    removeFamily
};
