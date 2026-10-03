const db = require("../config/db");


// =================================
// GET ITEMS (relief item catalogue)
// =================================

const getItems = async (req, res) => {
    try {
        const [result] = await db.query(`
            SELECT
                i.item_id,
                i.item_code,
                i.item_name,
                i.unit,
                i.category_id,
                ic.category_name
            FROM items i
            LEFT JOIN item_categories ic ON i.category_id = ic.category_id
            WHERE i.is_active = 1
            ORDER BY i.item_name
        `);
        res.json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
    }
};


// =================================
// GET ITEM CATEGORIES
// =================================

const getItemCategories = async (req, res) => {
    try {
        const [result] = await db.query(`SELECT * FROM item_categories ORDER BY category_name`);
        res.json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
    }
};


// =================================
// GET DONORS
// A DONOR account only sees its own donor profile.
// =================================

const getDonors = async (req, res) => {
    try {
        let sql = `
            SELECT donor_id, user_id, donor_code, donor_name, donor_type, phone, email, created_at
            FROM donors
        `;
        const values = [];

        if (req.user.role_id === 5) {
            sql += ` WHERE user_id = ?`;
            values.push(req.user.user_id);
        }

        sql += ` ORDER BY donor_name`;

        const [result] = await db.query(sql, values);
        res.json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
    }
};


module.exports = {
    getItems,
    getItemCategories,
    getDonors
};
