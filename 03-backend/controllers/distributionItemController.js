const db = require("../config/db");


// =================================
// ADD DISTRIBUTION ITEM
// =================================

const addDistributionItem = (req, res) => {


    const {

        distribution_id,
        request_item_id,
        item_id,
        quantity

    } = req.body;



    if(!distribution_id || !request_item_id || !item_id || !quantity){

        return res.status(400).json({

            message:"Required fields missing"

        });

    }



    if(Number(quantity) <= 0){

        return res.status(400).json({

            message:"Quantity must be greater than zero"

        });

    }



    db.beginTransaction((err)=>{


        if(err){

            return res.status(500).json({

                message:"Transaction error"

            });

        }



        // =================================
        // CHECK REQUEST ITEM
        // =================================


        const checkRequestSql = `

            SELECT

                request_id,
                item_id,
                requested_qty,
                fulfilled_qty

            FROM relief_request_items

            WHERE request_item_id = ?

        `;



        db.query(

            checkRequestSql,

            [request_item_id],

            (err,requestResult)=>{


                if(err){

                    return rollback(res,err);

                }



                if(requestResult.length === 0){

                    return rollback(res,{

                        message:"Request item not found"

                    });

                }



                const requestItem = requestResult[0];



                // Check item match

                if(
                    Number(requestItem.item_id)
                    !==
                    Number(item_id)
                ){

                    return rollback(res,{

                        message:"Item does not match request item"

                    });

                }



                // Check requested quantity limit

                if(
                    Number(requestItem.fulfilled_qty)
                    +
                    Number(quantity)
                    >
                    Number(requestItem.requested_qty)
                ){

                    return rollback(res,{

                        message:
                        "Cannot distribute more than requested quantity"

                    });

                }





                const request_id = requestItem.request_id;





                // =================================
                // FIND SHELTER
                // =================================


                const shelterSql = `

                    SELECT rr.shelter_id

                    FROM distributions d

                    JOIN relief_requests rr

                    ON d.request_id = rr.request_id

                    WHERE d.distribution_id = ?

                `;



                db.query(

                    shelterSql,

                    [distribution_id],

                    (err,result)=>{


                        if(err){

                            return rollback(res,err);

                        }



                        if(result.length === 0){

                            return rollback(res,{

                                message:"Distribution not found"

                            });

                        }



                        const shelter_id = result[0].shelter_id;





                        // =================================
                        // CHECK INVENTORY
                        // =================================


                        const stockSql = `

                            SELECT quantity

                            FROM shelter_inventory

                            WHERE shelter_id = ?

                            AND item_id = ?

                        `;



                        db.query(

                            stockSql,

                            [
                                shelter_id,
                                item_id
                            ],

                            (err,stock)=>{


                                if(err){

                                    return rollback(res,err);

                                }



                                if(stock.length === 0){

                                    return rollback(res,{

                                        message:
                                        "Item not available in inventory"

                                    });

                                }



                                if(
                                    Number(stock[0].quantity)
                                    <
                                    Number(quantity)
                                ){

                                    return rollback(res,{

                                        message:
                                        "Insufficient stock"

                                    });

                                }





                                // =================================
                                // REDUCE INVENTORY
                                // =================================


                                const updateInventory = `

                                    UPDATE shelter_inventory

                                    SET quantity = quantity - ?

                                    WHERE shelter_id = ?

                                    AND item_id = ?

                                `;



                                db.query(

                                    updateInventory,

                                    [
                                        quantity,
                                        shelter_id,
                                        item_id
                                    ],

                                    (err)=>{


                                        if(err){

                                            return rollback(res,err);

                                        }





                                        // =================================
                                        // CHECK EXISTING DISTRIBUTION ITEM
                                        // =================================


                                        const checkDistributionSql = `

                                            SELECT distribution_item_id

                                            FROM distribution_items

                                            WHERE distribution_id = ?

                                            AND request_item_id = ?

                                        `;



                                        db.query(

                                            checkDistributionSql,

                                            [
                                                distribution_id,
                                                request_item_id
                                            ],

                                            (err,existing)=>{


                                                if(err){

                                                    return rollback(res,err);

                                                }



                                                let query;
                                                let values;



                                                if(existing.length > 0){


                                                    query = `

                                                        UPDATE distribution_items

                                                        SET quantity = quantity + ?

                                                        WHERE distribution_item_id = ?

                                                    `;


                                                    values = [

                                                        quantity,

                                                        existing[0].distribution_item_id

                                                    ];


                                                }

                                                else{


                                                    query = `

                                                        INSERT INTO distribution_items

                                                        (
                                                            distribution_id,
                                                            request_item_id,
                                                            item_id,
                                                            quantity
                                                        )

                                                        VALUES(?,?,?,?)

                                                    `;



                                                    values = [

                                                        distribution_id,
                                                        request_item_id,
                                                        item_id,
                                                        quantity

                                                    ];


                                                }




                                                db.query(

                                                    query,

                                                    values,

                                                    (err,result)=>{


                                                        if(err){

                                                            return rollback(res,err);

                                                        }





                                                        // =================================
                                                        // UPDATE FULFILLED QTY
                                                        // =================================


                                                        const updateFulfilled = `

                                                            UPDATE relief_request_items

                                                            SET fulfilled_qty = fulfilled_qty + ?

                                                            WHERE request_item_id = ?

                                                        `;



                                                        db.query(

                                                            updateFulfilled,

                                                            [
                                                                quantity,
                                                                request_item_id
                                                            ],

                                                            (err)=>{


                                                                if(err){

                                                                    return rollback(res,err);

                                                                }





                                                                // =================================
                                                                // UPDATE REQUEST STATUS
                                                                // =================================


                                                                const statusSql = `

                                                                    SELECT

                                                                        SUM(requested_qty) AS total_requested,

                                                                        SUM(fulfilled_qty) AS total_fulfilled

                                                                    FROM relief_request_items

                                                                    WHERE request_id = ?

                                                                `;



                                                                db.query(

                                                                    statusSql,

                                                                    [request_id],

                                                                    (err,statusResult)=>{


                                                                        if(err){

                                                                            return rollback(res,err);

                                                                        }



                                                                        const totalRequested =
                                                                        Number(statusResult[0].total_requested);



                                                                        const totalFulfilled =
                                                                        Number(statusResult[0].total_fulfilled);



                                                                        let newStatus;



                                                                        if(
                                                                            totalFulfilled >= totalRequested
                                                                        ){

                                                                            newStatus =
                                                                            "DELIVERED";

                                                                        }

                                                                        else{

                                                                            newStatus =
                                                                            "PARTIALLY_DELIVERED";

                                                                        }





                                                                        const updateStatusSql = `

                                                                            UPDATE relief_requests

                                                                            SET status = ?

                                                                            WHERE request_id = ?

                                                                        `;



                                                                        db.query(

                                                                            updateStatusSql,

                                                                            [
                                                                                newStatus,
                                                                                request_id
                                                                            ],

                                                                            (err)=>{


                                                                                if(err){

                                                                                    return rollback(res,err);

                                                                                }




                                                                                db.commit((err)=>{


                                                                                    if(err){

                                                                                        return rollback(res,err);

                                                                                    }



                                                                                    res.json({

                                                                                        message:
                                                                                        "Distribution completed successfully",

                                                                                        request_status:
                                                                                        newStatus,

                                                                                        distribution_item_id:
                                                                                        result.insertId || null

                                                                                    });



                                                                                });



                                                                            }

                                                                        );



                                                                    }

                                                                );



                                                            }

                                                        );



                                                    }

                                                );



                                            }

                                        );



                                    }

                                );



                            }

                        );



                    }

                );



            }

        );



    });


};





// =================================
// ROLLBACK
// =================================

const rollback = (res,error)=>{


    db.rollback(()=>{


        res.status(400).json({

            message:error.message || "Operation failed",

            error:error.sqlMessage || null

        });


    });


};





module.exports = {

    addDistributionItem

};