const pool = require("../config/db");

// GET /api/reports/summary
const getReportSummary = async (req, res) => {
    try {
        const db = pool.promise();

        const [
            [familySummary],
            [shelterSummary],
            [inventorySummary],
            [requestSummary],
            [donationSummary],
            [distributionSummary]
        ] = await Promise.all([

            // ==========================================
            // 1. FAMILY SUMMARY
            // ==========================================
            db.query(`
                SELECT
                    COUNT(*) AS total_families,
                    SUM(status = 'NEEDS_SHELTER') AS needs_shelter,
                    SUM(status = 'SHELTERED') AS sheltered
                FROM families
            `),

            // ==========================================
            // 2. SHELTER SUMMARY
            // ==========================================
            db.query(`
                SELECT
                    COUNT(*) AS total_shelters,
                    COALESCE(SUM(total_capacity), 0) AS total_capacity,
                    COALESCE(SUM(current_occupancy), 0) AS total_occupancy,
                    COALESCE(SUM(available_capacity), 0) AS total_available_capacity
                FROM vw_shelter_capacity
            `),

            // ==========================================
            // 3. INVENTORY SUMMARY
            // ==========================================
            db.query(`
                SELECT
                    COUNT(*) AS inventory_records,
                    COALESCE(SUM(quantity), 0) AS total_quantity,
                    SUM(quantity <= reorder_level) AS low_stock_items
                FROM shelter_inventory
            `),

            // ==========================================
            // 4. RELIEF REQUEST SUMMARY
            // ==========================================
            db.query(`
                SELECT
                    COUNT(*) AS total_requests,
                    SUM(status = 'PENDING') AS pending,
                    SUM(status = 'APPROVED') AS approved,
                    SUM(status = 'PARTIALLY_DELIVERED') AS partially_delivered,
                    SUM(status = 'DELIVERED') AS delivered,
                    SUM(status = 'REJECTED') AS rejected,
                    SUM(status = 'CANCELLED') AS cancelled,
                    SUM(priority = 'CRITICAL'
                        AND status NOT IN ('DELIVERED', 'REJECTED', 'CANCELLED')
                    ) AS active_critical_requests
                FROM relief_requests
            `),

            // ==========================================
            // 5. DONATION SUMMARY
            // ==========================================
            db.query(`
                SELECT
                    COUNT(*) AS total_donations,
                    SUM(status = 'PENDING') AS pending,
                    SUM(status = 'RECEIVED') AS received,
                    SUM(status = 'CANCELLED') AS cancelled
                FROM donations
            `),

            // ==========================================
            // 6. DISTRIBUTION SUMMARY
            // ==========================================
            db.query(`
                SELECT
                    COUNT(*) AS total_distributions,
                    SUM(status = 'PENDING') AS pending,
                    SUM(status = 'COMPLETED') AS completed,
                    SUM(status = 'CANCELLED') AS cancelled
                FROM distributions
            `)
        ]);

        res.status(200).json({
            families: {
                total: Number(familySummary[0].total_families),
                needs_shelter: Number(familySummary[0].needs_shelter || 0),
                sheltered: Number(familySummary[0].sheltered || 0)
            },

            shelters: {
                total: Number(shelterSummary[0].total_shelters),
                total_capacity: Number(shelterSummary[0].total_capacity),
                total_occupancy: Number(shelterSummary[0].total_occupancy),
                total_available_capacity:
                    Number(shelterSummary[0].total_available_capacity)
            },

            inventory: {
                inventory_records:
                    Number(inventorySummary[0].inventory_records),
                total_quantity:
                    Number(inventorySummary[0].total_quantity),
                low_stock_items:
                    Number(inventorySummary[0].low_stock_items || 0)
            },

            relief_requests: {
                total: Number(requestSummary[0].total_requests),
                pending: Number(requestSummary[0].pending || 0),
                approved: Number(requestSummary[0].approved || 0),
                partially_delivered:
                    Number(requestSummary[0].partially_delivered || 0),
                delivered:
                    Number(requestSummary[0].delivered || 0),
                rejected:
                    Number(requestSummary[0].rejected || 0),
                cancelled:
                    Number(requestSummary[0].cancelled || 0),
                active_critical:
                    Number(requestSummary[0].active_critical_requests || 0)
            },

            donations: {
                total: Number(donationSummary[0].total_donations),
                pending: Number(donationSummary[0].pending || 0),
                received: Number(donationSummary[0].received || 0),
                cancelled: Number(donationSummary[0].cancelled || 0)
            },

            distributions: {
                total: Number(distributionSummary[0].total_distributions),
                pending: Number(distributionSummary[0].pending || 0),
                completed: Number(distributionSummary[0].completed || 0),
                cancelled: Number(distributionSummary[0].cancelled || 0)
            }
        });

    } catch (error) {
        console.error("Report summary error:", error);

        res.status(500).json({
            message: "Failed to load report summary"
        });
    }
};

module.exports = {
    getReportSummary
};