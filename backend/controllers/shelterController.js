const db = require("../config/db");


// =================================
// CREATE SHELTER (ADMIN ONLY)
// =================================

const createShelter = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const shelter_name = String(req.body.shelter_name || '').trim();
        const shelter_type = String(req.body.shelter_type || 'COLLECTIVE').toUpperCase();
        const district = String(req.body.district || '').trim();
        const upazila = String(req.body.upazila || '').trim() || null;
        const address = String(req.body.address || '').trim() || null;
        const total_capacity = Number(req.body.total_capacity);

        const allowedTypes = ['COLLECTIVE', 'TEMPORARY', 'TRANSITIONAL', 'OTHER'];

        if (!shelter_name || !district || !Number.isInteger(total_capacity) || total_capacity < 1) {
            return res.status(400).json({
                message: 'Shelter name, district and a valid capacity are required'
            });
        }

        if (!allowedTypes.includes(shelter_type)) {
            return res.status(400).json({ message: 'Invalid shelter type' });
        }

        await connection.beginTransaction();

        // Lock the newest shelter row while generating the next human-readable code.
        const [lastRows] = await connection.query(
            `SELECT shelter_id, shelter_code
             FROM shelters
             ORDER BY shelter_id DESC
             LIMIT 1
             FOR UPDATE`
        );

        let nextNumber = 1;
        if (lastRows.length) {
            const numericPart = Number(String(lastRows[0].shelter_code || '').replace(/\D/g, ''));
            nextNumber = Number.isFinite(numericPart) && numericPart > 0
                ? numericPart + 1
                : Number(lastRows[0].shelter_id) + 1;
        }

        let shelter_code = `SH-${String(nextNumber).padStart(3, '0')}`;

        // In case historical codes do not follow the SH-### pattern, keep advancing
        // until an unused code is found.
        while (true) {
            const [existing] = await connection.query(
                'SELECT shelter_id FROM shelters WHERE shelter_code = ? LIMIT 1',
                [shelter_code]
            );
            if (!existing.length) break;
            nextNumber += 1;
            shelter_code = `SH-${String(nextNumber).padStart(3, '0')}`;
        }

        const [result] = await connection.query(
            `INSERT INTO shelters
                (shelter_code, shelter_name, shelter_type, district, upazila, address,
                 total_capacity, operational_status, created_by, current_occupancy)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, 0)`,
            [
                shelter_code,
                shelter_name,
                shelter_type,
                district,
                upazila,
                address,
                total_capacity,
                req.user.user_id
            ]
        );

        await connection.query(
            `INSERT INTO audit_logs
                (user_id, action_type, entity_type, entity_id, description)
             VALUES (?, 'INSERT', 'SHELTER', ?, ?)`,
            [
                req.user.user_id,
                result.insertId,
                `Shelter ${shelter_code} (${shelter_name}) created with capacity ${total_capacity}`
            ]
        );

        await connection.commit();

        return res.status(201).json({
            message: 'Shelter added successfully',
            shelter_id: result.insertId,
            shelter_code
        });
    } catch (err) {
        try { await connection.rollback(); } catch (_) { /* no-op */ }
        console.error(err);
        return res.status(500).json({ message: 'Could not create shelter', error: err.message });
    } finally {
        connection.release();
    }
};


const getAllShelters = async (req, res) => {
    try {
        const [result] = await db.query(`
            SELECT
                s.*,
                (
                    SELECT COUNT(DISTINCT sa.family_id)
                    FROM shelter_admissions sa
                    WHERE sa.shelter_id = s.shelter_id AND sa.status = 'ACTIVE'
                ) AS active_family_count
            FROM shelters s
        `);
        res.json(result);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Database error" });
    }
};


// =================================
// GET SHELTERS ASSIGNED TO CURRENT SHELTER MANAGER
// =================================

const getMyShelters = async (req, res) => {
    try {
        const user_id = req.user.user_id;

        const sql = `
            SELECT
                s.*
            FROM shelter_managers sm
            JOIN shelters s
                ON s.shelter_id = sm.shelter_id
            WHERE sm.user_id = ?
            ORDER BY s.shelter_name ASC
        `;

        const [result] = await db.query(sql, [user_id]);
        res.json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


const getAvailableShelters = async (req, res) => {
    try {
        const sql = `
            SELECT 
            shelter_name,
            total_capacity AS capacity,
            current_occupancy,
            GREATEST(total_capacity - current_occupancy,0) AS available_space,
            CASE
                WHEN current_occupancy >= total_capacity
                THEN 'FULL'
                ELSE 'AVAILABLE'
            END AS status
            FROM shelters
        `;
        const [result] = await db.query(sql);
        res.json(result);
    } catch (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


const recommendShelter = async (req, res) => {
    try {
        const { district, upazila } = req.query;
        const sql = `
            SELECT
                shelter_id,
                shelter_name,
                address,
                total_capacity,
                current_occupancy,
                GREATEST(total_capacity-current_occupancy,0)
                AS available_space
            FROM shelters
            WHERE district = ?
            AND upazila = ?
            AND current_occupancy < total_capacity
            ORDER BY available_space DESC
        `;
        const [result] = await db.query(sql, [district, upazila]);
        if (result.length === 0) {
            return res.json({ message: "No available shelter found" });
        }
        res.json(result);
    } catch (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


const getShelterCapacity = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT 
                s.shelter_id,
                s.shelter_name,
                s.total_capacity,
                s.current_occupancy,
                GREATEST(s.total_capacity - s.current_occupancy, 0) AS available_space,
                CASE
                    WHEN s.current_occupancy >= s.total_capacity THEN 'FULL'
                    WHEN s.current_occupancy >= s.total_capacity * 0.8 THEN 'NEARLY_FULL'
                    ELSE 'AVAILABLE'
                END AS status
            FROM shelters s
            WHERE s.shelter_id = ?
        `;
        const [result] = await db.query(sql, [id]);
        if (result.length === 0) {
            return res.status(404).json({ message: "Shelter not found" });
        }
        res.json(result[0]);
    } catch (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// ADMITTED FAMILIES (WITH MEMBERS) OF ONE SHELTER
// Admin and relief manager: any shelter. Shelter manager: only their own.
// =================================

const getShelterFamilies = async (req, res) => {
    try {
        const shelter_id = Number(req.params.id);
        if (!Number.isInteger(shelter_id) || shelter_id < 1) {
            return res.status(400).json({ message: "Valid shelter id is required" });
        }

        if (req.user.role_id === 2) {
            const [managed] = await db.query(
                `SELECT id FROM shelter_managers WHERE user_id = ? AND shelter_id = ? LIMIT 1`,
                [req.user.user_id, shelter_id]
            );
            if (managed.length === 0) {
                return res.status(403).json({ message: "You cannot view this shelter" });
            }
        }

        const [shelters] = await db.query(
            `SELECT shelter_id, shelter_code, shelter_name, district, upazila, address,
                    total_capacity, current_occupancy, operational_status
             FROM shelters WHERE shelter_id = ?`,
            [shelter_id]
        );
        if (shelters.length === 0) {
            return res.status(404).json({ message: "Shelter not found" });
        }

        const [families] = await db.query(
            `SELECT
                f.family_id, f.family_code, f.contact_phone, f.current_district, f.current_area,
                f.priority, f.status AS family_status,
                sa.admission_id, sa.admitted_member_count, sa.admitted_at
             FROM shelter_admissions sa
             JOIN families f ON f.family_id = sa.family_id
             WHERE sa.shelter_id = ? AND sa.status = 'ACTIVE'
             ORDER BY sa.admitted_at DESC`,
            [shelter_id]
        );

        let members = [];
        if (families.length) {
            const ids = families.map((f) => f.family_id);
            [members] = await db.query(
                `SELECT member_id, family_id, full_name, age_years, sex, is_head, relationship_to_head
                 FROM family_members
                 WHERE family_id IN (${ids.map(() => "?").join(",")})
                 ORDER BY family_id, is_head DESC, member_id`,
                ids
            );
        }

        const byFamily = new Map();
        members.forEach((m) => {
            if (!byFamily.has(m.family_id)) byFamily.set(m.family_id, []);
            byFamily.get(m.family_id).push(m);
        });

        res.json({
            shelter: {
                ...shelters[0],
                active_family_count: families.length,
                recorded_occupancy: families.reduce((sum, f) => sum + Number(f.admitted_member_count || 0), 0)
            },
            families: families.map((f) => ({ ...f, members: byFamily.get(f.family_id) || [] }))
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


module.exports = {
    createShelter,
    getShelterFamilies,
    getAllShelters,
    getMyShelters,
    getAvailableShelters,
    recommendShelter,
    getShelterCapacity
};