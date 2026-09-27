const pool = require("../config/db");

const getAuditLogs = async (req, res) => {
    try {
        const db = pool.promise();

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

module.exports = {
    getAuditLogs
};