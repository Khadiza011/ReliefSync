const db = require("../config/db");


// =================================
// GET ALL RELIEF REQUESTS
// =================================

const getAllRequests = async (req, res) => {
    try {
        const params = [];
        // Shelter managers only see requests for the shelters assigned to them
        const scope = req.user.role_id === 2
            ? `WHERE rr.shelter_id IN (SELECT sm.shelter_id FROM shelter_managers sm WHERE sm.user_id = ?)`
            : "";
        if (req.user.role_id === 2) params.push(req.user.user_id);

        const sql = `
            SELECT
                rr.request_id,
                rr.shelter_id,
                rr.request_code,
                rr.priority,
                rr.status,
                rr.requested_at,
                rr.notes,
                rr.requested_by,
                rr.approved_by,
                rr.approved_at,
                s.shelter_name,
                s.district,
                s.upazila
            FROM relief_requests rr
            JOIN shelters s
            ON rr.shelter_id = s.shelter_id
            ${scope}
            ORDER BY rr.requested_at DESC
        `;
        const [result] = await db.query(sql, params);
        res.json(result);
    } catch (err) {
        return res.status(500).json({ message: "Database error" });
    }
};


// =================================
// CREATE RELIEF REQUEST
// =================================

const createRequest = async (req, res) => {
    try {
        const { shelter_id, priority, notes } = req.body;
        const user_id = req.user.user_id;
        const role_id = req.user.role_id;

        if (!shelter_id || !priority) {
            return res.status(400).json({ message: "Shelter and priority required" });
        }

        const allowedPriority = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
        if (!allowedPriority.includes(priority)) {
            return res.status(400).json({ message: "Invalid priority" });
        }

        const request_code = "REQ-" + Date.now();

        // ADMIN
        if (role_id === 1) {
            const sql = `
                INSERT INTO relief_requests
                (request_code, shelter_id, priority, status, requested_by, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.query(sql, [request_code, shelter_id, priority, "REQUESTED", user_id, notes || null]);
            return res.status(201).json({
                message: "Relief request created successfully",
                request_id: result.insertId,
                request_code
            });
        }

        // SHELTER MANAGER
        if (role_id === 2) {
            const checkSql = `
                SELECT shelter_id
                FROM shelter_managers
                WHERE user_id = ? AND shelter_id = ?
            `;
            const [checkResult] = await db.query(checkSql, [user_id, shelter_id]);
            if (checkResult.length === 0) {
                return res.status(403).json({ message: "You cannot create request for this shelter" });
            }
            const sql = `
                INSERT INTO relief_requests
                (request_code, shelter_id, priority, status, requested_by, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.query(sql, [request_code, shelter_id, priority, "REQUESTED", user_id, notes || null]);
            return res.status(201).json({
                message: "Relief request created successfully",
                request_id: result.insertId,
                request_code
            });
        }

        return res.status(403).json({ message: "Access denied" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// UPDATE STATUS
// =================================

const updateRequestStatus = async (req, res) => {
    try {
        const { request_id, status } = req.body;
        const user_id = req.user.user_id;
        const role_id = req.user.role_id;

        if (!request_id || !status) {
            return res.status(400).json({ message: "Request id and status required" });
        }

        const allowedStatus = ["APPROVED", "CANCELLED"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Invalid status update" });
        }

        // only admin / relief manager
        if (role_id !== 1 && role_id !== 3) {
            return res.status(403).json({ message: "You cannot update request status" });
        }

        const [currentResult] = await db.query(`SELECT status FROM relief_requests WHERE request_id = ?`, [request_id]);
        if (currentResult.length === 0) {
            return res.status(404).json({ message: "Request not found" });
        }

        const currentStatus = currentResult[0].status;
        if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
            return res.status(400).json({ message: "Request already closed" });
        }

        const updateSql = `
            UPDATE relief_requests
            SET status = ?, approved_by = ?, approved_at = NOW()
            WHERE request_id = ?
        `;
        await db.query(updateSql, [status, user_id, request_id]);

        res.json({ message: "Request status updated successfully" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


module.exports = {
    getAllRequests,
    createRequest,
    updateRequestStatus
};