const db = require("../config/db");


// =================================
// ADD DISTRIBUTION ITEM
// =================================

const addDistributionItem = (req,res)=>{


    const {

        distribution_id,
        request_item_id,
        item_id,
        quantity

    } = req.body;



    const created_by = req.user.user_id;



    if(
        !distribution_id ||
        !request_item_id ||
        !item_id ||
        !quantity
    ){

        return res.status(400).json({

            message:"Required fields missing"

        });

    }




    if(Number(quantity)<=0){

        return res.status(400).json({

            message:"Quantity must be greater than zero"

        });

    }





    db.beginTransaction((err)=>{


        if(err){

            return res.status(500).json({

                message:"Transaction start failed"

            });

        }





        // ===============================
        // CHECK DISTRIBUTION
        // ===============================


        const distributionSql = `

            SELECT distribution_id

            FROM distributions

            WHERE distribution_id = ?

        `;



        db.query(

            distributionSql,

            [distribution_id],

            (err,distribution)=>{


                if(err)
                    return rollback(res,err);



                if(distribution.length===0){

                    return rollback(res,{

                        message:"Distribution not found"

                    });

                }





                checkRequestItem();


            }

        );






        function checkRequestItem(){



            const requestSql = `

                SELECT

                    rr.request_id,

                    rr.status,

                    rri.item_id,

                    rri.requested_qty,

                    rri.fulfilled_qty


                FROM relief_request_items rri


                JOIN relief_requests rr

                ON rri.request_id = rr.request_id


                WHERE rri.request_item_id = ?

            `;



            db.query(

                requestSql,

                [request_item_id],


                (err,result)=>{


                    if(err)
                        return rollback(res,err);




                    if(result.length===0){

                        return rollback(res,{

                            message:"Request item not found"

                        });

                    }





                    const requestData=result[0];





                    if(

                        requestData.status !== "APPROVED" &&

                        requestData.status !== "PARTIALLY_DELIVERED"

                    ){

                        return rollback(res,{

                            message:
                            "Request is not ready for distribution"

                        });

                    }





                    if(

                        Number(requestData.item_id)
                        !==
                        Number(item_id)

                    ){

                        return rollback(res,{

                            message:"Item mismatch"

                        });

                    }





                    if(

                        Number(requestData.fulfilled_qty)
                        +
                        Number(quantity)

                        >

                        Number(requestData.requested_qty)

                    ){

                        return rollback(res,{

                            message:
                            "Cannot exceed requested quantity"

                        });

                    }




                    checkDuplicate(requestData);



                }

            );


        }






        function checkDuplicate(requestData){



            const duplicateSql = `

                SELECT distribution_item_id

                FROM distribution_items

                WHERE distribution_id=?

                AND request_item_id=?

            `;



            db.query(

                duplicateSql,

                [

                    distribution_id,

                    request_item_id

                ],


                (err,result)=>{


                    if(err)
                        return rollback(res,err);




                    if(result.length>0){

                        return rollback(res,{

                            message:
                            "Item already distributed"

                        });

                    }




                    updateInventory(requestData);



                }

            );


        }







        function updateInventory(requestData){



            const inventorySql = `

                SELECT

                    inventory_id,

                    quantity


                FROM shelter_inventory


                WHERE shelter_id =

                (

                    SELECT shelter_id

                    FROM relief_requests

                    WHERE request_id=?

                )


                AND item_id=?

            `;



            db.query(

                inventorySql,

                [

                    requestData.request_id,

                    item_id

                ],


                (err,result)=>{


                    if(err)
                        return rollback(res,err);




                    if(result.length===0){

                        return rollback(res,{

                            message:
                            "Inventory not found"

                        });

                    }




                    const inventory = result[0];

                    const currentStock =
                    Number(inventory.quantity);



                    if(currentStock < Number(quantity)){


                        return rollback(res,{

                            message:
                            "Insufficient inventory"

                        });

                    }





                    const newBalance =
                    currentStock - Number(quantity);





                    db.query(

                        `

                        UPDATE shelter_inventory

                        SET quantity=?

                        WHERE inventory_id=?

                        `,


                        [

                            newBalance,

                            inventory.inventory_id

                        ],


                        (err)=>{


                            if(err)
                                return rollback(res,err);




                            createTransaction(

                                inventory.inventory_id,

                                newBalance,

                                requestData

                            );


                        }


                    );



                }

            );


        }








        function createTransaction(

            inventory_id,

            newBalance,

            requestData

        ){



            const sql = `

                INSERT INTO inventory_transactions

                (

                    inventory_id,

                    txn_type,

                    quantity,

                    balance_after,

                    reference_type,

                    reference_id,

                    notes,

                    created_by

                )


                VALUES(?,?,?,?,?,?,?,?)

            `;



            db.query(

                sql,

                [

                    inventory_id,

                    "OUT",

                    quantity,

                    newBalance,

                    "DISTRIBUTION",

                    distribution_id,

                    "Relief distribution",

                    created_by

                ],


                (err)=>{


                    if(err)
                        return rollback(res,err);




                    insertDistributionItem(requestData);



                }

            );



        }








        function insertDistributionItem(requestData){



            const sql = `

                INSERT INTO distribution_items

                (

                    distribution_id,

                    request_item_id,

                    item_id,

                    quantity

                )


                VALUES(?,?,?,?)

            `;



            db.query(

                sql,

                [

                    distribution_id,

                    request_item_id,

                    item_id,

                    quantity

                ],


                (err)=>{


                    if(err)
                        return rollback(res,err);



                    updateFulfilled(requestData);



                }

            );



        }







        function updateFulfilled(requestData){



            db.query(

                `

                UPDATE relief_request_items

                SET fulfilled_qty = fulfilled_qty + ?

                WHERE request_item_id=?

                `,


                [

                    quantity,

                    request_item_id

                ],


                (err)=>{


                    if(err)
                        return rollback(res,err);



                    updateStatus(requestData);



                }


            );



        }







        function updateStatus(requestData){



            const sql = `

                SELECT

                SUM(requested_qty) total_requested,

                SUM(fulfilled_qty) total_fulfilled


                FROM relief_request_items


                WHERE request_id=?

            `;



            db.query(

                sql,

                [

                    requestData.request_id

                ],


                (err,result)=>{


                    if(err)
                        return rollback(res,err);




                    let status =
                    "PARTIALLY_DELIVERED";




                    if(

                        Number(result[0].total_fulfilled)
                        >=
                        Number(result[0].total_requested)

                    ){

                        status="DELIVERED";

                    }





                    db.query(

                        `

                        UPDATE relief_requests

                        SET status=?

                        WHERE request_id=?

                        `,


                        [

                            status,

                            requestData.request_id

                        ],


                        (err)=>{


                            if(err)
                                return rollback(res,err);




                            db.commit((err)=>{


                                if(err)
                                    return rollback(res,err);




                                res.status(201).json({

                                    message:
                                    "Distribution item added successfully",

                                    status

                                });


                            });



                        }



                    );



                }


            );



        }



    });


};






const rollback=(res,error)=>{


    db.rollback(()=>{


        res.status(400).json({

            message:
            error.message || "Operation failed"

        });


    });


};





module.exports={

    addDistributionItem

};