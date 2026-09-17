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

const reduceInventory = (req,res)=>{

    const {
        shelter_id,
        item_id,
        quantity
    } = req.body;


    const sql = `
        UPDATE shelter_inventory

        SET quantity = quantity - ?

        WHERE shelter_id = ?

        AND item_id = ?

        AND quantity >= ?
    `;


    db.query(
        sql,
        [
            quantity,
            shelter_id,
            item_id,
            quantity
        ],

        (err,result)=>{


            if(err){

                console.log(err);

                return res.status(500).json({
                    message:"Database error",
                    error:err.sqlMessage
                });

            }


            if(result.affectedRows === 0){

                return res.status(400).json({
                    message:"Insufficient stock or item not found"
                });

            }


            res.json({
                message:"Inventory reduced successfully"
            });

        }
    );

};

// =================================
// ADD INVENTORY STOCK
// =================================

const addInventory = (req,res)=>{


    const {

        shelter_id,
        item_id,
        quantity

    } = req.body;



    // Validate quantity

    if(quantity <= 0){

        return res.status(400).json({

            message:"Quantity must be greater than zero"

        });

    }



    const checkSql = `

        SELECT *

        FROM shelter_inventory

        WHERE shelter_id = ?

        AND item_id = ?

    `;



    db.query(

        checkSql,

        [
            shelter_id,
            item_id
        ],

        (err,result)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error",
                    error:err.message

                });

            }



            // If item already exists, increase quantity

            if(result.length > 0){


                const updateSql = `

                    UPDATE shelter_inventory

                    SET quantity = quantity + ?

                    WHERE shelter_id = ?

                    AND item_id = ?

                `;



                db.query(

                    updateSql,

                    [
                        quantity,
                        shelter_id,
                        item_id
                    ],

                    (err)=>{


                        if(err){

                            return res.status(500).json({

                                message:"Database error",
                                error:err.message

                            });

                        }


                        res.json({

                            message:"Inventory increased successfully"

                        });


                    }

                );


            }


            // If new item entry

            else{


                const insertSql = `

                    INSERT INTO shelter_inventory

                    (
                        shelter_id,
                        item_id,
                        quantity
                    )

                    VALUES (?,?,?)

                `;



                db.query(

                    insertSql,

                    [
                        shelter_id,
                        item_id,
                        quantity
                    ],

                    (err,result)=>{


                        if(err){

                            return res.status(500).json({

                                message:"Database error",
                                error:err.message

                            });

                        }


                        res.json({

                            message:"Inventory added successfully",

                            inventory_id:result.insertId

                        });


                    }

                );


            }


        }

    );


};

// =================================
// GET LOW STOCK ITEMS
// =================================

const getLowStock = (req,res)=>{


    const sql = `

        SELECT

            si.inventory_id,
            s.shelter_name,
            i.item_name,
            si.quantity,
            si.reorder_level,

            'LOW_STOCK' AS status


        FROM shelter_inventory si


        JOIN shelters s

        ON si.shelter_id = s.shelter_id



        JOIN items i

        ON si.item_id = i.item_id



        WHERE si.quantity <= si.reorder_level

    `;



    db.query(

        sql,

        (err,result)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error",

                    error:err.message

                });

            }



            res.json(result);


        }

    );


};

module.exports = {

    getInventory,

    reduceInventory,

    addInventory,

    getLowStock

};