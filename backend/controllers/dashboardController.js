const db = require("../config/db");

const getDashboardSummary = async (req, res) => {
    try {
        const [
            [families], [shelters], [availableShelters], [pendingRequests],
            [criticalRequests], [lowStock], [pendingDonations], [activeVolunteers],
            [totalUsers], [totalInventory], [totalDonations], [totalDistributions]
        ] = await Promise.all([
            db.query(`SELECT COUNT(*) AS total_families FROM families`),
            db.query(`SELECT COUNT(*) AS total_shelters FROM shelters`),
            db.query(`SELECT COUNT(*) AS available_shelters FROM vw_shelter_capacity WHERE capacity_status COLLATE utf8mb4_general_ci = 'AVAILABLE'`),
            db.query(`SELECT COUNT(*) AS pending_requests FROM relief_requests WHERE status = 'REQUESTED'`),
            db.query(`SELECT COUNT(*) AS critical_requests FROM relief_requests WHERE priority = 'CRITICAL' AND status IN ('REQUESTED','APPROVED','PARTIALLY_DELIVERED')`),
            db.query(`SELECT COUNT(*) AS low_stock_items FROM shelter_inventory WHERE quantity <= reorder_level`),
            db.query(`SELECT COUNT(*) AS pending_donations FROM donations WHERE status = 'PENDING'`),
            db.query(`SELECT COUNT(*) AS active_volunteers FROM volunteers WHERE availability = 'AVAILABLE'`),
            db.query(`SELECT COUNT(*) AS total_users FROM users WHERE status = 'ACTIVE'`),
            db.query(`SELECT COUNT(*) AS total_inventory_items FROM shelter_inventory`),
            db.query(`SELECT COUNT(*) AS total_donations FROM donations`),
            db.query(`SELECT COUNT(*) AS total_distributions FROM distributions`)
        ]);

        res.status(200).json({
            total_families: families[0].total_families,
            total_shelters: shelters[0].total_shelters,
            available_shelters: availableShelters[0].available_shelters,
            pending_requests: pendingRequests[0].pending_requests,
            critical_requests: criticalRequests[0].critical_requests,
            low_stock_items: lowStock[0].low_stock_items,
            pending_donations: pendingDonations[0].pending_donations,
            active_volunteers: activeVolunteers[0].active_volunteers,
            total_users: totalUsers[0].total_users,
            total_inventory_items: totalInventory[0].total_inventory_items,
            total_donations: totalDonations[0].total_donations,
            total_distributions: totalDistributions[0].total_distributions
        });
    } catch (error) {
        console.error("Dashboard summary error:", error);
        res.status(500).json({ message: "Failed to load dashboard summary" });
    }
};

const notification = (id, type, title, sub, to, tone, createdAt, count = 1) => ({
    id: String(id), type, title, sub, to, tone, created_at: createdAt, count: Number(count) || 1
});

// Recipient-oriented notification feed.
// Important rule: a user does NOT get notified about actions they performed themselves.
// Only incoming work/messages/reports/status changes that need that user's attention are shown.
const getNotifications = async (req, res) => {
    try {
        const role = Number(req.user.role_id);
        const userId = Number(req.user.user_id);
        const list = [];

        // ADMIN: incoming approval/work requests from other users.
        if (role === 1) {
            const [deleteReqs, volunteerApprovals, reliefReqs] = await Promise.all([
                db.query(`SELECT adr.request_id, adr.user_id, adr.reason, adr.requested_at,
                                 u.full_name, u.email, r.role_name
                          FROM account_deletion_requests adr
                          JOIN users u ON u.user_id = adr.user_id
                          JOIN roles r ON r.role_id = u.role_id
                          WHERE adr.status='PENDING' AND adr.user_id <> ?
                          ORDER BY adr.requested_at DESC LIMIT 5`, [userId]),
                db.query(`SELECT u.user_id, u.full_name, u.email, u.created_at
                          FROM users u
                          WHERE u.role_id=4 AND u.status='INACTIVE' AND u.deleted_at IS NULL
                            AND NOT EXISTS (
                                SELECT 1 FROM account_deletion_requests adr
                                WHERE adr.user_id=u.user_id AND adr.status='PENDING'
                            )
                          ORDER BY u.created_at DESC LIMIT 5`),
                db.query(`SELECT rr.request_id, rr.request_code, rr.priority, rr.requested_at,
                                 s.shelter_name, u.full_name AS requester_name
                          FROM relief_requests rr
                          JOIN shelters s ON s.shelter_id=rr.shelter_id
                          JOIN users u ON u.user_id=rr.requested_by
                          WHERE rr.status='REQUESTED' AND rr.requested_by <> ?
                          ORDER BY rr.requested_at DESC LIMIT 5`, [userId])
            ]);

            deleteReqs[0].forEach((r) => list.push(notification(
                `delete-request-${r.request_id}`, 'request',
                `Account deletion requested by ${r.full_name || r.email}`,
                `${r.role_name.replaceAll('_',' ')} · Review required`, '/users', 'danger', r.requested_at
            )));

            volunteerApprovals[0].forEach((u) => list.push(notification(
                `volunteer-approval-${u.user_id}`, 'request',
                `${u.full_name || u.email} is waiting for volunteer approval`,
                'Approve or reject the new volunteer account', '/volunteers', 'cyan', u.created_at
            )));

            reliefReqs[0].forEach((r) => list.push(notification(
                `relief-request-${r.request_id}`, 'request',
                `${r.request_code} needs approval`,
                `${r.requester_name} · ${r.shelter_name} · ${r.priority}`, '/requests',
                r.priority === 'CRITICAL' ? 'danger' : 'cyan', r.requested_at
            )));
        }

        // SHELTER MANAGER: things sent to their shelter by OTHER users.
        if (role === 2) {
            const [managed] = await db.query(`SELECT shelter_id FROM shelter_managers WHERE user_id=?`, [userId]);
            const ids = managed.map((r) => r.shelter_id);
            if (ids.length) {
                const ph = ids.map(() => '?').join(',');
                const [stockReports, donations] = await Promise.all([
                    db.query(`SELECT isr.report_id, isr.reported_at, isr.quantity_at_report,
                                     i.item_name, s.shelter_name, u.full_name AS volunteer_name
                              FROM inventory_stock_reports isr
                              JOIN items i ON i.item_id=isr.item_id
                              JOIN shelters s ON s.shelter_id=isr.shelter_id
                              JOIN volunteers v ON v.volunteer_id=isr.volunteer_id
                              LEFT JOIN users u ON u.user_id=v.user_id
                              WHERE isr.shelter_id IN (${ph}) AND isr.status='OPEN'
                              ORDER BY isr.reported_at DESC LIMIT 6`, ids),
                    db.query(`SELECT d.donation_id, d.donation_code, d.received_at,
                                     s.shelter_name, dn.donor_name
                              FROM donations d
                              JOIN shelters s ON s.shelter_id=d.shelter_id
                              JOIN donors dn ON dn.donor_id=d.donor_id
                              WHERE d.shelter_id IN (${ph}) AND d.status='PENDING'
                                AND (dn.user_id IS NULL OR dn.user_id <> ?)
                              ORDER BY d.received_at DESC LIMIT 5`, [...ids, userId])
                ]);

                stockReports[0].forEach((r) => list.push(notification(
                    `stock-report-${r.report_id}`, 'inventory',
                    `${r.volunteer_name || 'Volunteer'} reported low stock`,
                    `${r.item_name} · ${r.shelter_name} · stock ${r.quantity_at_report}`,
                    '/inventory', 'warning', r.reported_at
                )));

                donations[0].forEach((d) => list.push(notification(
                    `incoming-donation-${d.donation_id}`, 'donation',
                    `${d.donor_name} sent a donation`,
                    `${d.donation_code} · ${d.shelter_name} · receipt pending`,
                    '/donations', 'violet', d.received_at
                )));
            }
        }

        // RELIEF MANAGER: requests submitted by OTHER users that need review/dispatch.
        if (role === 3) {
            const [requests] = await db.query(`SELECT rr.request_id, rr.request_code, rr.priority, rr.status,
                                                     rr.requested_at, s.shelter_name,
                                                     u.full_name AS requester_name
                                              FROM relief_requests rr
                                              JOIN shelters s ON s.shelter_id=rr.shelter_id
                                              JOIN users u ON u.user_id=rr.requested_by
                                              WHERE rr.requested_by <> ?
                                                AND rr.status IN ('REQUESTED','APPROVED','PARTIALLY_DELIVERED')
                                              ORDER BY rr.requested_at DESC LIMIT 8`, [userId]);

            requests.forEach((r) => list.push(notification(
                `rm-request-${r.request_id}-${r.status}`, 'request',
                r.status === 'REQUESTED'
                    ? `${r.request_code} awaiting approval`
                    : `${r.request_code} needs dispatch attention`,
                `${r.requester_name} · ${r.shelter_name} · ${r.status.replaceAll('_',' ')}`,
                '/requests', r.priority === 'CRITICAL' ? 'danger' : 'cyan', r.requested_at
            )));
        }

        // VOLUNTEER: only work assigned TO this volunteer by somebody else.
        if (role === 4) {
            const [volRows] = await db.query(`SELECT volunteer_id FROM volunteers WHERE user_id=? LIMIT 1`, [userId]);
            if (volRows.length) {
                const volunteerId = volRows[0].volunteer_id;
                const [assignments] = await db.query(`SELECT a.assignment_id, a.task_title, a.status,
                                                            a.assigned_at, s.shelter_name
                                                     FROM assignments a
                                                     JOIN shelters s ON s.shelter_id=a.shelter_id
                                                     WHERE a.volunteer_id=? AND a.status='ACTIVE'
                                                     ORDER BY a.assigned_at DESC LIMIT 8`, [volunteerId]);
                assignments.forEach((a) => list.push(notification(
                    `assignment-${a.assignment_id}`, 'assignment',
                    `New/active assignment: ${a.task_title}`,
                    `${a.shelter_name} · Assigned to you`, '/volunteer/assignments', 'cyan', a.assigned_at
                )));
            }
        }

        // DONOR: do not notify about the donation they submitted themselves.
        // Notify only when another user changes/acts on one of their donations.
        if (role === 5) {
            const [donorRows] = await db.query(`SELECT donor_id FROM donors WHERE user_id=? LIMIT 1`, [userId]);
            if (donorRows.length) {
                const donorId = donorRows[0].donor_id;
                const [rows] = await db.query(`SELECT a.audit_id, a.action_type, a.description, a.created_at,
                                                     d.donation_code, d.status, s.shelter_name
                                              FROM audit_logs a
                                              JOIN donations d ON d.donation_id=a.entity_id
                                              JOIN shelters s ON s.shelter_id=d.shelter_id
                                              WHERE a.entity_type='DONATION'
                                                AND d.donor_id=?
                                                AND (a.user_id IS NULL OR a.user_id <> ?)
                                              ORDER BY a.created_at DESC, a.audit_id DESC LIMIT 8`, [donorId, userId]);
                rows.forEach((r) => list.push(notification(
                    `donor-update-${r.audit_id}`, 'donation',
                    `${r.donation_code} updated`,
                    `${r.status} · ${r.description || r.shelter_name}`, '/donations',
                    r.status === 'RECEIVED' ? 'success' : 'violet', r.created_at
                )));
            }
        }

        // Most recent incoming items first. No self-generated audit/activity items are included.
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        res.json(list.slice(0, 10));
    } catch (error) {
        console.error('Notifications error:', error);
        res.status(500).json({ message: 'Failed to load notifications' });
    }
};

module.exports = { getDashboardSummary, getNotifications };
