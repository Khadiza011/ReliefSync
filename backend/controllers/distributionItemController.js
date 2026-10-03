const db = require("../config/db");


// Business rule errors are reported to the client with status 400
class DistributionError extends Error {}


// =================================
// ADD DISTRIBUTION ITEM
// (reduces shelter inventory, logs the transaction,
//  updates fulfilled qty and request status — all in one transaction)
// =================================

const addDistributionItem = async (req, res) => {
    const {
        distribution_id,
        request_item_id,
        item_id,
        quantity
    } = req.body;

    const created_by = req.user.user_id;

    if (!distribution_id || !request_item_id || !item_id || !quantity) {
        return res.status(400).json({ message: "Required fields missing" });
    }

    if (Number(quantity) <= 0) {
        return res.status(400).json({ message: "Quantity must be greater than zero" });
    }

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // CHECK DISTRIBUTION
        const [distribution] = await connection.query(
            `SELECT distribution_id FROM distributions WHERE distribution_id = ?`,
            [distribution_id]
        );
        if (distribution.length === 0) {
            throw new DistributionError("Distribution not found");
        }

        // CHECK REQUEST ITEM
        const [requestRows] = await connection.query(
            `
                SELECT
                    rr.request_id,
                    rr.status,
                    rri.item_id,
                    rri.requested_qty,
                    rri.fulfilled_qty
                FROM relief_request_items rri
                JOIN relief_requests rr
                ON rri.request_id = rr.request_id
                WHERE rri.request_item_id = ?
            `,
            [request_item_id]
        );
        if (requestRows.length === 0) {
            throw new DistributionError("Request item not found");
        }

        const requestData = requestRows[0];

        if (requestData.status !== "APPROVED" && requestData.status !== "PARTIALLY_DELIVERED") {
            throw new DistributionError("Request is not ready for distribution");
        }
        if (Number(requestData.item_id) !== Number(item_id)) {
            throw new DistributionError("Item mismatch");
        }
        if (Number(requestData.fulfilled_qty) + Number(quantity) > Number(requestData.requested_qty)) {
            throw new DistributionError("Cannot exceed requested quantity");
        }

        // CHECK DUPLICATE
        const [duplicate] = await connection.query(
            `
                SELECT distribution_item_id
                FROM distribution_items
                WHERE distribution_id = ? AND request_item_id = ?
            `,
            [distribution_id, request_item_id]
        );
        if (duplicate.length > 0) {
            throw new DistributionError("Item already distributed");
        }

        // UPDATE INVENTORY
        const [inventoryRows] = await connection.query(
            `
                SELECT inventory_id, quantity
                FROM shelter_inventory
                WHERE shelter_id = (
                    SELECT shelter_id FROM relief_requests WHERE request_id = ?
                )
                AND item_id = ?
            `,
            [requestData.request_id, item_id]
        );
        if (inventoryRows.length === 0) {
            throw new DistributionError("Inventory not found");
        }

        const inventory = inventoryRows[0];
        const currentStock = Number(inventory.quantity);

        if (currentStock < Number(quantity)) {
            throw new DistributionError("Insufficient inventory");
        }

        const newBalance = currentStock - Number(quantity);

        await connection.query(
            `UPDATE shelter_inventory SET quantity = ? WHERE inventory_id = ?`,
            [newBalance, inventory.inventory_id]
        );

        // CREATE TRANSACTION
        await connection.query(
            `
                INSERT INTO inventory_transactions
                (inventory_id, txn_type, quantity, balance_after, reference_type, reference_id, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [inventory.inventory_id, "OUT", quantity, newBalance, "DISTRIBUTION", distribution_id, "Relief distribution", created_by]
        );

        // INSERT DISTRIBUTION ITEM
        await connection.query(
            `
                INSERT INTO distribution_items
                (distribution_id, request_item_id, item_id, quantity)
                VALUES (?, ?, ?, ?)
            `,
            [distribution_id, request_item_id, item_id, quantity]
        );

        // UPDATE FULFILLED
        await connection.query(
            `
                UPDATE relief_request_items
                SET fulfilled_qty = fulfilled_qty + ?
                WHERE request_item_id = ?
            `,
            [quantity, request_item_id]
        );

        // UPDATE REQUEST STATUS
        // DELIVERED only when every item line is fully fulfilled, otherwise PARTIALLY_DELIVERED
        const [totals] = await connection.query(
            `
                SELECT
                    COUNT(*) AS total_lines,
                    SUM(CASE WHEN fulfilled_qty >= requested_qty THEN 1 ELSE 0 END) AS complete_lines
                FROM relief_request_items
                WHERE request_id = ?
            `,
            [requestData.request_id]
        );

        let status = "PARTIALLY_DELIVERED";

        if (Number(totals[0].total_lines) > 0 && Number(totals[0].complete_lines) >= Number(totals[0].total_lines)) {
            status = "DELIVERED";
        }

        await connection.query(
            `UPDATE relief_requests SET status = ? WHERE request_id = ?`,
            [status, requestData.request_id]
        );

        // MARK THIS DISTRIBUTION AS DISPATCHED
        await connection.query(
            `UPDATE distributions SET status = 'COMPLETED' WHERE distribution_id = ? AND status = 'PENDING'`,
            [distribution_id]
        );

        await connection.commit();

        res.status(201).json({
            message: "Distribution item added successfully",
            status
        });

    } catch (err) {
        if (connection) {
            await connection.rollback().catch(() => {});
        }
        if (!(err instanceof DistributionError)) {
            console.error(err);
        }
        res.status(400).json({ message: err.message || "Operation failed" });
    } finally {
        if (connection) connection.release();
    }
};


module.exports = {
    addDistributionItem
};
