const db = require("../config/db");


// =================================
// GET ALL DISTRIBUTIONS
// =================================

const getAllDistributions = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const role_id = req.user.role_id;

        let sql = `
            SELECT
                d.distribution_id,
                d.distribution_code,
                d.request_id,
                d.status,
                d.distributed_by,
                d.distributed_at,
                d.notes,
                rr.request_code,
                rr.priority as request_priority,
                rr.status as request_status,
                s.shelter_id,
                s.shelter_name,
                s.district,
                u.full_name as distributed_by_name,
                (SELECT COUNT(*) FROM distribution_items di WHERE di.distribution_id = d.distribution_id) AS item_count,
                (SELECT COALESCE(SUM(di.quantity), 0) FROM distribution_items di WHERE di.distribution_id = d.distribution_id) AS total_quantity
            FROM distributions d
            JOIN relief_requests rr ON d.request_id = rr.request_id
            JOIN shelters s ON rr.shelter_id = s.shelter_id
            LEFT JOIN users u ON d.distributed_by = u.user_id
        `;

        const params = [];

        // Shelter managers can only see distributions for shelters assigned to them.
        if (role_id === 2) {
            sql += `
                WHERE rr.shelter_id IN (
                    SELECT sm.shelter_id
                    FROM shelter_managers sm
                    WHERE sm.user_id = ?
                )
            `;
            params.push(user_id);
        }

        sql += ` ORDER BY d.distributed_at DESC `;

        const [result] = await db.query(sql, params);
        res.json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// CREATE DISTRIBUTION
// =================================

const createDistribution = async (req, res) => {
    try {
        const { request_id, notes } = req.body;
        const distributed_by = req.user.user_id;

        if (!request_id) {
            return res.status(400).json({ message: "Request id is required" });
        }

        // Check request exists and status
        const [result] = await db.query(
            `SELECT request_id, status FROM relief_requests WHERE request_id = ?`,
            [request_id]
        );

        if (result.length === 0) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (result[0].status !== "APPROVED" && result[0].status !== "PARTIALLY_DELIVERED") {
            return res.status(400).json({ message: "Only approved or partially delivered requests can be distributed" });
        }

        const distribution_code = "DIST-" + Date.now();

        const [insertResult] = await db.query(
            `
                INSERT INTO distributions
                (distribution_code, request_id, status, distributed_by, notes)
                VALUES (?, ?, ?, ?, ?)
            `,
            [distribution_code, request_id, "PENDING", distributed_by, notes || null]
        );

        res.status(201).json({
            message: "Distribution created successfully",
            distribution_id: insertResult.insertId,
            distribution_code
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
    }
};


module.exports = {
    getAllDistributions,
    createDistribution
};
