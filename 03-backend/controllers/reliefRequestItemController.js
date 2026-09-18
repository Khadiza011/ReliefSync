const db = require("../config/db");



// =================================
// CHECK REQUEST STATUS
// =================================

const checkRequestStatus = (request_id, callback)=>{


    const sql = `

        SELECT status

        FROM relief_requests

        WHERE request_id = ?

    `;



    db.query(

        sql,

        [request_id],

        (err,result)=>{


            if(err){

                return callback(err,null);

            }



            if(result.length === 0){

                return callback(null,null);

            }



            callback(null,result[0].status);


        }

    );


};





// =================================
// ADD REQUEST ITEM
// =================================

const addRequestItem = (req,res)=>{


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





    if(

        isNaN(requested_qty) ||

        requested_qty <= 0

    ){


        return res.status(400).json({

            message:
            "Quantity must be greater than zero"

        });


    }





    checkRequestStatus(

        request_id,

        (err,status)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error"

                });

            }




            if(!status){

                return res.status(404).json({

                    message:"Request not found"

                });

            }





            if(

                status !== "REQUESTED" &&

                status !== "APPROVED"

            ){


                return res.status(400).json({

                    message:
                    "Cannot modify items after delivery started"

                });


            }





            // Check duplicate item

            const checkSql = `

                SELECT request_item_id

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

                            message:"Database error"

                        });

                    }





                    if(result.length > 0){


                        return res.status(400).json({

                            message:
                            "Item already exists in this request"

                        });


                    }





                    const insertSql = `

                        INSERT INTO relief_request_items

                        (

                            request_id,

                            item_id,

                            requested_qty,

                            fulfilled_qty

                        )

                        VALUES(?,?,?,0)

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

                                    message:
                                    "Database error"

                                });

                            }



                            res.status(201).json({

                                message:
                                "Request item added successfully",

                                request_item_id:
                                result.insertId


                            });


                        }


                    );


                }


            );



        }


    );



};







// =================================
// GET REQUEST ITEMS
// =================================

const getRequestItems = (req,res)=>{


    const {

        request_id

    } = req.params;




    const sql = `

        SELECT

            rri.request_item_id,

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

                    message:"Database error"

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




    if(

        fulfilled_qty === undefined ||

        fulfilled_qty < 0 ||

        isNaN(fulfilled_qty)

    ){


        return res.status(400).json({

            message:
            "Invalid fulfilled quantity"

        });


    }





    const checkSql = `

        SELECT

            requested_qty,

            fulfilled_qty


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

                    message:"Database error"

                });

            }




            if(result.length===0){

                return res.status(404).json({

                    message:
                    "Request item not found"

                });

            }





            if(

                fulfilled_qty >

                result[0].requested_qty

            ){


                return res.status(400).json({

                    message:
                    "Fulfilled quantity cannot exceed requested quantity"

                });


            }





            const updateSql = `

                UPDATE relief_request_items

                SET fulfilled_qty = ?

                WHERE request_id = ?

                AND item_id = ?

            `;




            db.query(

                updateSql,

                [

                    fulfilled_qty,

                    request_id,

                    item_id

                ],


                (err)=>{


                    if(err){

                        return res.status(500).json({

                            message:"Database error"

                        });

                    }




                    res.json({

                        message:
                        "Fulfilled quantity updated"

                    });



                }


            );



        }


    );



};






module.exports = {


    addRequestItem,

    getRequestItems,

    updateFulfilledQty


};