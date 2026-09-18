const db = require("../config/db");


// =================================
// CHECK SHELTER ACCESS
// =================================

const checkShelterAccess = (req, shelter_id, callback)=>{


    const user_id = req.user.user_id;
    const role_id = req.user.role_id;


    // ADMIN + RELIEF_MANAGER

    if(role_id === 1 || role_id === 3){

        return callback(true);

    }



    // SHELTER_MANAGER

    if(role_id === 2){


        const sql = `

            SELECT shelter_id

            FROM shelter_managers

            WHERE user_id = ?

            AND shelter_id = ?

        `;


        return db.query(

            sql,

            [
                user_id,
                shelter_id
            ],

            (err,result)=>{


                if(err){

                    return callback(false);

                }


                if(result.length > 0){

                    return callback(true);

                }


                callback(false);


            }

        );


    }



    return callback(false);


};





// =================================
// GET INVENTORY LIST
// =================================

const getInventory = (req,res)=>{


    const user_id = req.user.user_id;
    const role_id = req.user.role_id;



    let sql = `

    SELECT

        si.inventory_id,

        si.shelter_id,

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



    let values = [];



    if(role_id === 2){


        sql += `

        WHERE si.shelter_id IN

        (

            SELECT shelter_id

            FROM shelter_managers

            WHERE user_id = ?

        )

        `;


        values.push(user_id);


    }



    else if(role_id === 4){


        sql += `

        WHERE si.shelter_id IN

        (

            SELECT shelter_id

            FROM assignments a

            JOIN volunteers v

            ON a.volunteer_id = v.volunteer_id

            WHERE v.user_id = ?

            AND a.status='ACTIVE'

        )

        `;


        values.push(user_id);


    }



    db.query(

        sql,

        values,

        (err,result)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error"

                });

            }



            res.json(result);


        }

    );


};






// =================================
// REDUCE INVENTORY WITH TRANSACTION
// =================================

const reduceInventory = (req,res)=>{


    const {

        shelter_id,

        item_id,

        quantity

    } = req.body;



    if(!quantity || isNaN(quantity) || quantity <= 0){

        return res.status(400).json({

            message:"Quantity must be greater than zero"

        });

    }



    checkShelterAccess(

        req,

        shelter_id,

        (allowed)=>{


            if(!allowed){

                return res.status(403).json({

                    message:"You cannot access this shelter inventory"

                });

            }




            db.beginTransaction((err)=>{


                if(err){

                    return res.status(500).json({

                        message:"Transaction start failed"

                    });

                }





                const updateSql = `

                UPDATE shelter_inventory

                SET quantity = quantity - ?

                WHERE shelter_id = ?

                AND item_id = ?

                AND quantity >= ?

                `;



                db.query(

                    updateSql,

                    [

                        quantity,

                        shelter_id,

                        item_id,

                        quantity

                    ],

                    (err,result)=>{


                        if(err || result.affectedRows === 0){


                            return db.rollback(()=>{


                                res.status(400).json({

                                    message:
                                    "Insufficient stock or item not found"

                                });


                            });


                        }




                        const balanceSql = `

                        SELECT

                            inventory_id,

                            quantity

                        FROM shelter_inventory

                        WHERE shelter_id = ?

                        AND item_id = ?

                        `;



                        db.query(

                            balanceSql,

                            [

                                shelter_id,

                                item_id

                            ],

                            (err,stock)=>{


                                if(err){


                                    return db.rollback(()=>{

                                        res.status(500).json({

                                            message:
                                            "Balance fetch failed"

                                        });

                                    });


                                }





                                const txnSql = `

                                INSERT INTO inventory_transactions

                                (

                                    inventory_id,

                                    txn_type,

                                    quantity,

                                    balance_after,

                                    reference_type,

                                    created_by

                                )

                                VALUES(?,?,?,?,?,?)

                                `;



                                db.query(

                                    txnSql,

                                    [

                                        stock[0].inventory_id,

                                        "OUT",

                                        quantity,

                                        stock[0].quantity,

                                        "INVENTORY_REDUCE",

                                        req.user.user_id

                                    ],

                                    (err)=>{


                                        if(err){


                                            return db.rollback(()=>{

                                                res.status(500).json({

                                                    message:
                                                    "Audit transaction failed"

                                                });

                                            });


                                        }





                                        db.commit((err)=>{


                                            if(err){


                                                return db.rollback(()=>{

                                                    res.status(500).json({

                                                        message:
                                                        "Commit failed"

                                                    });

                                                });


                                            }





                                            res.json({

                                                message:
                                                "Inventory reduced successfully"

                                            });



                                        });


                                    }


                                );



                            }


                        );



                    }


                );



            });



        }


    );


};

// =================================
// ADD INVENTORY WITH TRANSACTION
// =================================

const addInventory = (req,res)=>{


    const {

        shelter_id,
        item_id,
        quantity

    } = req.body;



    if(!quantity || isNaN(quantity) || quantity <= 0){

        return res.status(400).json({

            message:"Quantity must be greater than zero"

        });

    }



    checkShelterAccess(

        req,

        shelter_id,

        (allowed)=>{


            if(!allowed){

                return res.status(403).json({

                    message:"You cannot access this shelter inventory"

                });

            }



            db.beginTransaction((err)=>{


                if(err){

                    return res.status(500).json({

                        message:"Transaction start failed"

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

                            return db.rollback(()=>{

                                res.status(500).json({

                                    message:"Database error"

                                });

                            });

                        }





                        // Existing item

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

                                        return db.rollback(()=>{

                                            res.status(500).json({

                                                message:"Inventory update failed"

                                            });

                                        });

                                    }





                                    saveInventoryTransaction(

                                        req,

                                        shelter_id,

                                        item_id,

                                        quantity,

                                        "IN",

                                        "INVENTORY_ADD",

                                        res

                                    );


                                }

                            );



                        }



                        // New item

                        else{


                            const insertSql = `

                                INSERT INTO shelter_inventory

                                (

                                    shelter_id,

                                    item_id,

                                    quantity

                                )

                                VALUES(?,?,?)

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

                                        return db.rollback(()=>{

                                            res.status(500).json({

                                                message:"Inventory insert failed"

                                            });

                                        });

                                    }





                                    saveInventoryTransaction(

                                        req,

                                        null,

                                        item_id,

                                        quantity,

                                        "IN",

                                        "INVENTORY_ADD",

                                        res,

                                        result.insertId

                                    );


                                }

                            );


                        }


                    }


                );



            });


        }


    );


};

// =================================
// SAVE INVENTORY TRANSACTION
// =================================

const saveInventoryTransaction = (
    req,
    shelter_id,
    item_id,
    quantity,
    txn_type,
    reference_type,
    res,
    inventory_id = null
)=>{


    let sql;
    let values;



    // New inventory হলে inventory_id already আছে
    if(inventory_id){


        sql = `

            SELECT

                inventory_id,

                quantity

            FROM shelter_inventory

            WHERE inventory_id = ?

        `;


        values = [

            inventory_id

        ];


    }


    // Existing inventory হলে shelter + item দিয়ে খুঁজবে
    else{


        sql = `

            SELECT

                inventory_id,

                quantity

            FROM shelter_inventory

            WHERE shelter_id = ?

            AND item_id = ?

        `;


        values = [

            shelter_id,

            item_id

        ];


    }




    db.query(

        sql,

        values,

        (err,result)=>{


            if(err || result.length === 0){


                return db.rollback(()=>{


                    res.status(500).json({

                        message:
                        "Unable to fetch inventory balance"

                    });


                });


            }





            const inventory = result[0];





            const txnSql = `

                INSERT INTO inventory_transactions

                (

                    inventory_id,

                    txn_type,

                    quantity,

                    balance_after,

                    reference_type,

                    created_by

                )

                VALUES (?,?,?,?,?,?)

            `;





            db.query(

                txnSql,

                [

                    inventory.inventory_id,

                    txn_type,

                    quantity,

                    inventory.quantity,

                    reference_type,

                    req.user.user_id

                ],

                (err)=>{


                    if(err){


                        return db.rollback(()=>{


                            res.status(500).json({

                                message:
                                "Audit transaction failed",

                                error:err.message

                            });


                        });


                    }






                    db.commit((err)=>{


                        if(err){


                            return db.rollback(()=>{


                                res.status(500).json({

                                    message:
                                    "Transaction commit failed"

                                });


                            });


                        }




                        res.json({

                            message:
                            "Inventory updated successfully"

                        });



                    });



                }


            );



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