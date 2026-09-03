const db = require("../config/db");


// Get inventory list
const getInventory = (req, res) => {


    const sql = `
    SELECT
        si.inventory_id,
        s.shelter_name,
        i.item_name,
        ic.category_name,
        si.quantity
    FROM shelter_inventory si

    JOIN shelters s
    ON si.shelter_id = s.shelter_id

    JOIN items i
    ON si.item_id = i.item_id

    LEFT JOIN item_categories ic
    ON i.category_id = ic.category_id
`;


    db.query(sql, (err, result)=>{


        if(err){

            console.log(err);

            return res.status(500).json({
                message:"Database error"
            });

        }


        res.json(result);


    });


};



module.exports = {
    getInventory
};