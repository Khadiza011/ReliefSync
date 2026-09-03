const db = require("../config/db");


// Get all families
const getAllFamilies = (req, res) => {


    const sql = `
        SELECT
            family_id,
            family_code,
            contact_phone,
            current_district,
            current_area,
            priority,
            status
        FROM families
    `;


    db.query(sql, (err, result) => {


        if (err) {

            console.log(err);

            return res.status(500).json({
                message: "Database error"
            });

        }


        res.json(result);


    });

};



module.exports = {
    getAllFamilies
};