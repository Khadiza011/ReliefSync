const db = require("../config/db");


// =================================
// ADD REQUEST ITEM
// =================================

const addRequestItem = (req, res) => {


    const {

        request_id,
        item_id,
        requested_qty

    } = req.body;



    if(!request_id || !item_id || !requested_qty){

        return res.status(400).json({

            message:"Required fields missing"

        });

    }



    if(requested_qty <= 0){

        return res.status(400).json({

            message:"Quantity must be greater than zero"

        });

    }




    // Check duplicate item in same request

    const checkSql = `

        SELECT *

        FROM relief_request_items

        WHERE request_id = ?

        AND item_id = ?

    `;



    db.query(

        checkSql,

        [
            request_id,
            item_id
        ],

        (err,result)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error",
                    error:err.message

                });

            }




            // Already exists -> increase quantity

            if(result.length > 0){


                const updateSql = `

                    UPDATE relief_request_items

                    SET requested_qty = requested_qty + ?

                    WHERE request_id = ?

                    AND item_id = ?

                `;



                db.query(

                    updateSql,

                    [
                        requested_qty,
                        request_id,
                        item_id
                    ],

                    (err)=>{


                        if(err){

                            return res.status(500).json({

                                message:"Update error",
                                error:err.message

                            });

                        }



                        res.json({

                            message:"Request item quantity updated"

                        });


                    }

                );


            }




            // New item insert

            else{


                const insertSql = `

                    INSERT INTO relief_request_items

                    (

                        request_id,

                        item_id,

                        requested_qty,

                        fulfilled_qty

                    )

                    VALUES (?,?,?,0)

                `;



                db.query(

                    insertSql,

                    [

                        request_id,

                        item_id,

                        requested_qty

                    ],

                    (err,result)=>{


                        if(err){

                            return res.status(500).json({

                                message:"Database error",
                                error:err.message

                            });

                        }



                        res.json({

                            message:"Request item added successfully",

                            request_item_id:result.insertId

                        });


                    }

                );


            }


        }

    );


};





// =================================
// GET REQUEST ITEMS BY REQUEST ID
// =================================

const getRequestItems = (req,res)=>{


    const {

        request_id

    } = req.params;



    const sql = `

        SELECT

        rri.request_id,

        i.item_name,

        i.unit,

        rri.requested_qty,

        rri.fulfilled_qty


        FROM relief_request_items rri


        JOIN items i

        ON rri.item_id = i.item_id


        WHERE rri.request_id = ?

    `;



    db.query(

        sql,

        [request_id],

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





// =================================
// UPDATE FULFILLED QUANTITY
// =================================

const updateFulfilledQty = (req,res)=>{


    const {

        request_id,

        item_id,

        fulfilled_qty

    } = req.body;



    if(fulfilled_qty < 0){

        return res.status(400).json({

            message:"Invalid fulfilled quantity"

        });

    }




    const sql = `

        UPDATE relief_request_items

        SET fulfilled_qty = ?

        WHERE request_id = ?

        AND item_id = ?

    `;



    db.query(

        sql,

        [

            fulfilled_qty,

            request_id,

            item_id

        ],

        (err,result)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error",
                    error:err.message

                });

            }



            if(result.affectedRows === 0){

                return res.status(404).json({

                    message:"Request item not found"

                });

            }



            res.json({

                message:"Fulfilled quantity updated"

            });


        }

    );


};





module.exports = {


    addRequestItem,

    getRequestItems,

    updateFulfilledQty


};