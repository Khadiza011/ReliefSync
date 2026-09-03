const db = require("../config/db");


// Get all disasters
const getAllDisasters = (req, res) => {


    const sql = `
        SELECT
            disaster_id,
            disaster_name,
            disaster_type,
            start_date,
            end_date,
            status
        FROM disasters
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
    getAllDisasters
};