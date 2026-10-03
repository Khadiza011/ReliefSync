const db = require("../config/db");


// Business rule errors carry their own HTTP status
class DonationError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}


// =================================
// GET ALL DONATIONS
// =================================

const getAllDonations = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const role_id = req.user.role_id;

        let sql = `
            SELECT
                d.donation_id,
                d.donation_code,
                d.donor_id,
                d.shelter_id,
                d.status,
                d.notes,
                d.received_at,
                dr.donor_name as donor_name,
                dr.donor_type,
                dr.user_id as donor_user_id,
                s.shelter_name,
                u.full_name as received_by_name,
                (SELECT COUNT(*) FROM donation_items di WHERE di.donation_id = d.donation_id) AS item_count,
                (SELECT COALESCE(SUM(di.quantity), 0) FROM donation_items di WHERE di.donation_id = d.donation_id) AS total_quantity
            FROM donations d
            JOIN donors dr ON d.donor_id = dr.donor_id
            JOIN shelters s ON d.shelter_id = s.shelter_id
            LEFT JOIN users u ON d.received_by = u.user_id
        `;

        const values = [];

        // Shelter managers may only see donations for shelters assigned to them.
        // Admin / Relief Manager keep the existing all-shelter view.
        // Donor filtering remains on the frontend as before.
        if (role_id === 2) {
            sql += `
                WHERE d.shelter_id IN (
                    SELECT sm.shelter_id
                    FROM shelter_managers sm
                    WHERE sm.user_id = ?
                )
            `;
            values.push(user_id);
        }

        sql += ` ORDER BY d.received_at DESC, d.donation_id DESC `;

        const [result] = await db.query(sql, values);
        res.json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// RESOLVE DONOR PROFILE FOR A DONOR USER
// A DONOR account submits on behalf of its own donor profile.
// If the account has no profile yet, one is created from the user record.
// =================================

const resolveDonorForUser = async (connection, user_id) => {
    const [linked] = await connection.query(
        `SELECT donor_id FROM donors WHERE user_id = ? LIMIT 1`,
        [user_id]
    );
    if (linked.length > 0) return linked[0].donor_id;

    const [users] = await connection.query(
        `SELECT full_name, email, phone FROM users WHERE user_id = ?`,
        [user_id]
    );
    if (users.length === 0) {
        throw new DonationError(404, "Donor account not found");
    }

    const [created] = await connection.query(
        `
            INSERT INTO donors (user_id, donor_code, donor_name, donor_type, phone, email)
            VALUES (?, ?, ?, 'INDIVIDUAL', ?, ?)
        `,
        [user_id, "DNR-U" + user_id, users[0].full_name, users[0].phone, users[0].email]
    );
    return created.insertId;
};


// =================================
// CREATE DONATION (DONOR SUBMIT)
// =================================

const createDonation = async (req, res) => {
    const { shelter_id, items, notes } = req.body;
    let { donor_id } = req.body;

    const isDonorAccount = req.user.role_id === 5;

    if (
        (!donor_id && !isDonorAccount) ||
        !shelter_id ||
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({ message: "Donor, shelter and items are required" });
    }

    for (const item of items) {
        if (!item.item_id || Number(item.quantity) <= 0) {
            return res.status(400).json({ message: "Invalid item quantity" });
        }
    }

    const donation_code = "DON-" + Date.now();
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        if (isDonorAccount) {
            donor_id = await resolveDonorForUser(connection, req.user.user_id);
        }

        // received_by is NOT NULL in the schema; it holds the submitter
        // until the donation is received, when it is overwritten.
        const [result] = await connection.query(
            `
                INSERT INTO donations
                (donation_code, donor_id, shelter_id, status, received_by, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `,
            [donation_code, donor_id, shelter_id, "PENDING", req.user.user_id, notes || null]
        );

        const donation_id = result.insertId;

        for (const { item_id, quantity } of items) {
            await connection.query(
                `
                    INSERT INTO donation_items (donation_id, item_id, quantity)
                    VALUES (?, ?, ?)
                `,
                [donation_id, item_id, quantity]
            );
        }

        await connection.commit();

        return res.status(201).json({
            message: "Donation submitted successfully",
            donation_id,
            status: "PENDING"
        });

    } catch (err) {
        if (connection) await connection.rollback().catch(() => {});
        if (err instanceof DonationError) {
            return res.status(err.status).json({ message: err.message });
        }
        console.error(err);
        return res.status(500).json({ message: "Database error" });
    } finally {
        if (connection) connection.release();
    }
};


// =================================
// RECEIVE DONATION
// (adds every donated item to the shelter inventory)
// =================================

const receiveDonation = async (req, res) => {
    const donation_id = req.params.id;
    const received_by = req.user.user_id;
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [donationRows] = await connection.query(
            `SELECT * FROM donations WHERE donation_id = ?`,
            [donation_id]
        );

        if (donationRows.length === 0) {
            throw new DonationError(404, "Donation not found");
        }

        const donation = donationRows[0];

        if (donation.status !== "PENDING") {
            throw new DonationError(400, "Donation already processed");
        }

        const [items] = await connection.query(
            `SELECT * FROM donation_items WHERE donation_id = ?`,
            [donation.donation_id]
        );

        for (const item of items) {
            const [inventoryRows] = await connection.query(
                `SELECT * FROM shelter_inventory WHERE shelter_id = ? AND item_id = ?`,
                [donation.shelter_id, item.item_id]
            );

            let inventory_id;

            if (inventoryRows.length > 0) {
                inventory_id = inventoryRows[0].inventory_id;
                await connection.query(
                    `UPDATE shelter_inventory SET quantity = quantity + ? WHERE inventory_id = ?`,
                    [item.quantity, inventory_id]
                );
            } else {
                const [inserted] = await connection.query(
                    `INSERT INTO shelter_inventory (shelter_id, item_id, quantity) VALUES (?, ?, ?)`,
                    [donation.shelter_id, item.item_id, item.quantity]
                );
                inventory_id = inserted.insertId;
            }

            await connection.query(
                `
                    INSERT INTO inventory_transactions
                    (inventory_id, txn_type, quantity, balance_after, reference_type, reference_id, created_by)
                    SELECT inventory_id, 'IN', ?, quantity, 'DONATION', ?, ?
                    FROM shelter_inventory
                    WHERE inventory_id = ?
                `,
                [item.quantity, donation.donation_id, received_by, inventory_id]
            );
        }

        await connection.query(
            `
                UPDATE donations
                SET status = 'RECEIVED', received_by = ?, received_at = NOW()
                WHERE donation_id = ?
            `,
            [received_by, donation.donation_id]
        );

        await connection.commit();

        res.json({ message: "Donation received successfully" });

    } catch (err) {
        if (connection) await connection.rollback().catch(() => {});
        if (err instanceof DonationError) {
            return res.status(err.status).json({ message: err.message });
        }
        console.error(err);
        return res.status(500).json({ message: "Database error" });
    } finally {
        if (connection) connection.release();
    }
};


module.exports = {
    getAllDonations,
    createDonation,
    receiveDonation
};
