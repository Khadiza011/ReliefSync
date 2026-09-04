const db = require("../config/db");


// ADD DISTRIBUTION ITEM

const addDistributionItem = (req, res) => {


    const {
        distribution_id,
        item_id,
        quantity
    } = req.body;



    const sql = `
        INSERT INTO distribution_items
        (
            distribution_id,
            item_id,
            quantity
        )

        VALUES (?, ?, ?)
    `;



    db.query(
        sql,
        [
            distribution_id,
            item_id,
            quantity
        ],

        (err, result)=>{


            if(err){

                console.log(err);

                return res.status(500).json({

                    message:"Database error",

                    error:err.sqlMessage

                });

            }



            res.json({

                message:"Distribution item added successfully"

            });



        }

    );


};



module.exports = {

    addDistributionItem

};