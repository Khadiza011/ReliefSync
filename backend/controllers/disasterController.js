const db = require("../config/db");


// Get all disasters
const getAllDisasters = async (req, res) => {
    try {
        const [result] = await db.query(`
            SELECT
                disaster_id,
                disaster_name,
                disaster_type,
                start_date,
                end_date,
                status
            FROM disasters
        `);

        res.json(result);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Database error" });
    }
};



module.exports = {
    getAllDisasters
};
