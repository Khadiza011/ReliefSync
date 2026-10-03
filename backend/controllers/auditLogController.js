const db = require("../config/db");

const getAuditLogs = async (req, res) => {
    try {
        const [logs] = await db.query(`
            SELECT
                a.audit_id,
                a.user_id,
                u.email,
                a.action_type,
                a.entity_type,
                a.entity_id,
                a.description,
                a.created_at
            FROM audit_logs a
            LEFT JOIN users u
                ON u.user_id = a.user_id
            ORDER BY a.created_at DESC
        `);

        res.status(200).json({
            total: logs.length,
            logs
        });

    } catch (error) {
        console.error("Audit log error:", error);

        res.status(500).json({
            message: "Failed to load audit logs"
        });
    }
};


// =================================
// INVENTORY TRANSACTION LEDGER
// =================================

const getInventoryTransactions = async (req, res) => {

    try {

        const [transactions] = await db.query(`
            SELECT
                t.txn_id,
                t.inventory_id,
                t.txn_type,
                t.quantity,
                t.balance_after,
                t.reference_type,
                t.reference_id,
                t.notes,
                t.created_by,
                t.created_at,
                u.full_name AS created_by_name,
                u.email AS created_by_email,
                s.shelter_name,
                i.item_name,
                i.unit
            FROM inventory_transactions t
            LEFT JOIN shelter_inventory si ON t.inventory_id = si.inventory_id
            LEFT JOIN shelters s ON si.shelter_id = s.shelter_id
            LEFT JOIN items i ON si.item_id = i.item_id
            LEFT JOIN users u ON t.created_by = u.user_id
            ORDER BY t.created_at DESC, t.txn_id DESC
        `);

        res.status(200).json({
            total: transactions.length,
            transactions
        });

    } catch (error) {

        console.error("Inventory transactions error:", error);
        res.status(500).json({
            message: "Failed to load inventory transactions"
        });

    }

};

module.exports = {
    getAuditLogs,
    getInventoryTransactions
};