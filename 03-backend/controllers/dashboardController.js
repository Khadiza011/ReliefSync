const pool = require("../config/db");

const getDashboardSummary = async (req, res) => {
    try {
        const db = pool.promise();

        const [
            [families],
            [shelters],
            [availableShelters],
            [pendingRequests],
            [criticalRequests],
            [lowStock],
            [pendingDonations],
            [activeVolunteers]
        ] = await Promise.all([

            db.query(`
                SELECT COUNT(*) AS total_families
                FROM families
            `),

            db.query(`
                SELECT COUNT(*) AS total_shelters
                FROM shelters
            `),

            db.query(`
                SELECT COUNT(*) AS available_shelters
                FROM vw_shelter_capacity
                WHERE capacity_status = 'AVAILABLE'
            `),

            db.query(`
                SELECT COUNT(*) AS pending_requests
                FROM relief_requests
                WHERE status = 'PENDING'
            `),

            db.query(`
                SELECT COUNT(*) AS critical_requests
                FROM relief_requests
                WHERE priority = 'CRITICAL'
                  AND status IN (
                      'PENDING',
                      'APPROVED',
                      'PARTIALLY_DELIVERED'
                  )
            `),

            db.query(`
                SELECT COUNT(*) AS low_stock_items
                FROM shelter_inventory
                WHERE quantity <= reorder_level
            `),

            db.query(`
                SELECT COUNT(*) AS pending_donations
                FROM donations
                WHERE status = 'PENDING'
            `),

            db.query(`
                SELECT COUNT(*) AS active_volunteers
                FROM volunteers
                WHERE availability = 'AVAILABLE'
            `)
        ]);

        res.status(200).json({
            total_families: families[0].total_families,
            total_shelters: shelters[0].total_shelters,
            available_shelters: availableShelters[0].available_shelters,
            pending_requests: pendingRequests[0].pending_requests,
            critical_requests: criticalRequests[0].critical_requests,
            low_stock_items: lowStock[0].low_stock_items,
            pending_donations: pendingDonations[0].pending_donations,
            active_volunteers: activeVolunteers[0].active_volunteers
        });

    } catch (error) {
        console.error("Dashboard summary error:", error);

        res.status(500).json({
            message: "Failed to load dashboard summary"
        });
    }
};

module.exports = {
    getDashboardSummary
};