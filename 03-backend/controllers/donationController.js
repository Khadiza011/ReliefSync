const db = require("../config/db");


// =================================
// CREATE DONATION (DONOR SUBMIT)
// =================================

const createDonation = (req,res)=>{


    const {
    shelter_id,
    items,
    notes
} = req.body;

const user_id = req.user.user_id;
const role_id = req.user.role_id;

let donor_id;

// Donor must use their own identity
if (role_id === 5) {
    donor_id = user_id;
}

// Admin can create donation on behalf of a donor
else if (role_id === 1) {
    donor_id = req.body.donor_id;
}else {
        return res.status(403).json({
            message: "You cannot create a donation"
        });
    }
    
    // =================================
    // REQUIRED FIELD VALIDATION
    // =================================

    if(

        !donor_id ||
        !shelter_id ||
        !Array.isArray(items) ||
        items.length === 0

    ){

        return res.status(400).json({

            message:
            "Donor, shelter and items are required"

        });

    }



    for(const item of items){


        if(

            !item.item_id ||
            Number(item.quantity)<=0

        ){

            return res.status(400).json({

                message:
                "Invalid item quantity"

            });

        }


    }





    const donation_code =
    "DON-" + Date.now();





    db.beginTransaction((err)=>{


        if(err){

            return res.status(500).json({

                message:"Transaction start failed"

            });

        }




        const sql = `

        INSERT INTO donations

        (

            donation_code,

            donor_id,

            shelter_id,

            status,

            notes

        )


        VALUES(?,?,?,?,?)

        `;



        db.query(

            sql,

            [

                donation_code,

                donor_id,

                shelter_id,

                "PENDING",

                notes || null

            ],


            (err,result)=>{


                if(err){

                    return rollback(res);

                }



                const donation_id =
                result.insertId;



                insertItems(

                    0,

                    items,

                    donation_id,

                    res

                );


            }

        );


    });


};







// =================================
// INSERT DONATION ITEMS
// =================================

const insertItems=(

    index,

    items,

    donation_id,

    res

)=>{


    if(index >= items.length){


        return db.commit((err)=>{


            if(err){

                return rollback(res);

            }



            return res.status(201).json({

                message:
                "Donation submitted successfully",

                donation_id,

                status:"PENDING"

            });


        });


    }




    const {

        item_id,

        quantity

    } = items[index];





    const sql = `

    INSERT INTO donation_items

    (

        donation_id,

        item_id,

        quantity

    )


    VALUES(?,?,?)

    `;



    db.query(

        sql,

        [

            donation_id,

            item_id,

            quantity

        ],


        (err)=>{


            if(err){

                return rollback(res);

            }



            insertItems(

                index+1,

                items,

                donation_id,

                res

            );


        }


    );



};









// =================================
// RECEIVE DONATION
// =================================


const receiveDonation=(req,res)=>{


    const donation_id =
    req.params.id;



    const received_by =
    req.user.user_id;





    db.beginTransaction((err)=>{


        if(err){

            return res.status(500).json({

                message:
                "Transaction start failed"

            });

        }





        const checkSql = `

        SELECT *

        FROM donations

        WHERE donation_id=?

        `;



        db.query(

            checkSql,

            [donation_id],


            (err,donation)=>{


                if(err){

                    return rollback(res);

                }




                if(donation.length===0){

                    return rollback(

                        res,

                        404,

                        "Donation not found"

                    );

                }




                if(

                    donation[0].status !== "PENDING"

                ){

                    return rollback(

                        res,

                        400,

                        "Donation already processed"

                    );

                }




                processReceive(

                    donation[0],

                    received_by,

                    res

                );


            }

        );



    });



};









const processReceive=(

    donation,

    received_by,

    res

)=>{


    const sql = `

    SELECT *

    FROM donation_items

    WHERE donation_id=?

    `;



    db.query(

        sql,

        [donation.donation_id],


        (err,items)=>{


            if(err){

                return rollback(res);

            }




            updateItems(

                0,

                items,

                donation,

                received_by,

                res

            );



        }

    );



};









const updateItems=(

    index,

    items,

    donation,

    received_by,

    res

)=>{


    if(index>=items.length){


        const sql = `

        UPDATE donations

        SET

        status='RECEIVED',

        received_by=?,

        received_at=NOW()

        WHERE donation_id=?

        `;



        return db.query(

            sql,

            [

                received_by,

                donation.donation_id

            ],


            (err)=>{


                if(err){

                    return rollback(res);

                }



                db.commit((err)=>{


                    if(err){

                        return rollback(res);

                    }



                    res.json({

                        message:
                        "Donation received successfully"

                    });



                });



            }

        );


    }





    const item = items[index];





    const inventorySql = `

    SELECT *

    FROM shelter_inventory

    WHERE shelter_id=?

    AND item_id=?

    `;



    db.query(

        inventorySql,

        [

            donation.shelter_id,

            item.item_id

        ],


        (err,result)=>{


            if(err){

                return rollback(res);

            }





            if(result.length>0){


                db.query(

                    `

                    UPDATE shelter_inventory

                    SET quantity = quantity + ?

                    WHERE inventory_id=?

                    `,


                    [

                        item.quantity,

                        result[0].inventory_id

                    ],


                    (err)=>{


                        if(err){

                            return rollback(res);

                        }



                        createTransaction(

                            result[0].inventory_id,

                            item.quantity,

                            donation.donation_id,

                            received_by,

                            ()=>{


                                updateItems(

                                    index+1,

                                    items,

                                    donation,

                                    received_by,

                                    res

                                );


                            }

                        );



                    }


                );



            }



        }


    );



};









const createTransaction=(

    inventory_id,

    quantity,

    donation_id,

    user_id,

    callback

)=>{


    const sql = `

    INSERT INTO inventory_transactions

    (

        inventory_id,

        txn_type,

        quantity,

        balance_after,

        reference_type,

        reference_id,

        created_by

    )


    SELECT

    inventory_id,

    'IN',

    ?,

    quantity,

    'DONATION',

    ?,

    ?

    FROM shelter_inventory

    WHERE inventory_id=?

    `;



    db.query(

        sql,

        [

            quantity,

            donation_id,

            user_id,

            inventory_id

        ],


        (err)=>{


            if(err){

                return callback(err);

            }



            callback();


        }

    );



};









const rollback=(

    res,

    status=500,

    message="Database error"

)=>{


    db.rollback(()=>{


        res.status(status).json({

            message

        });


    });


};






module.exports={

    createDonation,

    receiveDonation

};