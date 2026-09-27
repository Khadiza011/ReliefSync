const pool = require("../config/db");

// GET /api/alerts
const getAlerts = async (req, res) => {
    try {
        const db = pool.promise();

        const [
            [lowStockItems],
            [criticalRequests],
            [fullShelters]
        ] = await Promise.all([

            // ==========================================
            // 1. LOW STOCK ALERTS
            // ==========================================
            db.query(`
                SELECT
                    si.inventory_id,
                    si.shelter_id,
                    i.item_id,
                    i.item_name,
                    si.quantity,
                    si.reorder_level
                FROM shelter_inventory si
                JOIN items i
                    ON i.item_id = si.item_id
                WHERE si.quantity <= si.reorder_level
                ORDER BY si.quantity ASC
            `),

            // ==========================================
            // 2. CRITICAL RELIEF REQUESTS
            // ==========================================
            db.query(`
                SELECT
                    request_id,
                    request_code,
                    shelter_id,
                    priority,
                    status,
                    requested_at
                FROM relief_requests
                WHERE priority = 'CRITICAL'
                  AND status NOT IN (
                      'DELIVERED',
                      'REJECTED',
                      'CANCELLED'
                  )
                ORDER BY requested_at ASC
            `),

            // ==========================================
            // 3. FULL SHELTERS
            // ==========================================
            db.query(`
                SELECT
                    shelter_id,
                    shelter_code,
                    shelter_name,
                    district,
                    total_capacity,
                    current_occupancy,
                    available_capacity
                FROM vw_shelter_capacity
                WHERE available_capacity = 0
                ORDER BY shelter_name
            `)
        ]);

        const alerts = [];

        // Low stock alerts
        lowStockItems.forEach(item => {
            alerts.push({
                type: "LOW_STOCK",
                severity: "WARNING",
                message: `${item.item_name} is low in stock`,
                data: item
            });
        });

        // Critical request alerts
        criticalRequests.forEach(request => {
            alerts.push({
                type: "CRITICAL_REQUEST",
                severity: "CRITICAL",
                message: `Critical relief request ${request.request_code} requires attention`,
                data: request
            });
        });

        // Full shelter alerts
        fullShelters.forEach(shelter => {
            alerts.push({
                type: "SHELTER_FULL",
                severity: "CRITICAL",
                message: `${shelter.shelter_name} has no available capacity`,
                data: shelter
            });
        });

        res.status(200).json({
            total_alerts: alerts.length,
            alerts
        });

    } catch (error) {
        console.error("Alerts error:", error);

        res.status(500).json({
            message: "Failed to load alerts"
        });
    }
};

module.exports = {
    getAlerts
};