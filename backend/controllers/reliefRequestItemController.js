const db = require("../config/db");


// =================================
// ADD REQUEST ITEM
// =================================

const addRequestItem = async (req, res) => {
    try {
        const { request_id, item_id, requested_qty } = req.body;

        if (!request_id || !item_id || !requested_qty) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        if (isNaN(requested_qty) || requested_qty <= 0) {
            return res.status(400).json({ message: "Quantity must be greater than zero" });
        }

        // CHECK REQUEST STATUS
        const [statusRows] = await db.query(
            `SELECT status FROM relief_requests WHERE request_id = ?`,
            [request_id]
        );

        if (statusRows.length === 0) {
            return res.status(404).json({ message: "Request not found" });
        }

        const status = statusRows[0].status;
        if (status !== "REQUESTED" && status !== "APPROVED") {
            return res.status(400).json({ message: "Cannot modify items after delivery started" });
        }

        // Check duplicate item
        const [existing] = await db.query(
            `
                SELECT request_item_id
                FROM relief_request_items
                WHERE request_id = ? AND item_id = ?
            `,
            [request_id, item_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Item already exists in this request" });
        }

        const [result] = await db.query(
            `
                INSERT INTO relief_request_items
                (request_id, item_id, requested_qty, fulfilled_qty)
                VALUES (?, ?, ?, 0)
            `,
            [request_id, item_id, requested_qty]
        );

        res.status(201).json({
            message: "Request item added successfully",
            request_item_id: result.insertId
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
    }
};


// =================================
// GET REQUEST ITEMS
// =================================

const getRequestItems = async (req, res) => {
    try {
        const { request_id } = req.params;

        const [result] = await db.query(
            `
                SELECT
                    rri.request_item_id,
                    rri.request_id,
                    rri.item_id,
                    i.item_name,
                    i.unit,
                    rri.requested_qty,
                    rri.fulfilled_qty
                FROM relief_request_items rri
                JOIN items i
                ON rri.item_id = i.item_id
                WHERE rri.request_id = ?
            `,
            [request_id]
        );

        res.json(result);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
    }
};


// =================================
// UPDATE FULFILLED QUANTITY
// =================================

const updateFulfilledQty = async (req, res) => {
    try {
        const { request_id, item_id, fulfilled_qty } = req.body;

        if (fulfilled_qty === undefined || fulfilled_qty < 0 || isNaN(fulfilled_qty)) {
            return res.status(400).json({ message: "Invalid fulfilled quantity" });
        }

        const [result] = await db.query(
            `
                SELECT requested_qty, fulfilled_qty
                FROM relief_request_items
                WHERE request_id = ? AND item_id = ?
            `,
            [request_id, item_id]
        );

        if (result.length === 0) {
            return res.status(404).json({ message: "Request item not found" });
        }

        if (fulfilled_qty > result[0].requested_qty) {
            return res.status(400).json({ message: "Fulfilled quantity cannot exceed requested quantity" });
        }

        await db.query(
            `
                UPDATE relief_request_items
                SET fulfilled_qty = ?
                WHERE request_id = ? AND item_id = ?
            `,
            [fulfilled_qty, request_id, item_id]
        );

        res.json({ message: "Fulfilled quantity updated" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
    }
};


module.exports = {
    addRequestItem,
    getRequestItems,
    updateFulfilledQty
};
