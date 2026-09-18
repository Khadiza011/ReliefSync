const db = require("../config/db");



// =================================
// GET ALL RELIEF REQUESTS
// =================================

const getAllRequests = (req,res)=>{


    const sql = `

        SELECT

            rr.request_id,
            rr.request_code,
            rr.priority,
            rr.status,
            rr.requested_at,
            rr.notes,

            rr.requested_by,
            rr.approved_by,
            rr.approved_at,

            s.shelter_name,
            s.district,
            s.upazila


        FROM relief_requests rr


        JOIN shelters s

        ON rr.shelter_id = s.shelter_id


        ORDER BY rr.requested_at DESC

    `;



    db.query(sql,(err,result)=>{


        if(err){

            return res.status(500).json({

                message:"Database error"

            });

        }


        res.json(result);


    });


};





// =================================
// CREATE RELIEF REQUEST
// =================================

const createRequest = (req,res)=>{


    console.log("CREATE REQUEST CONTROLLER HIT");


    const {

        shelter_id,
        priority,
        notes

    } = req.body;



    const user_id = req.user.user_id;
    const role_id = req.user.role_id;



    if(!shelter_id || !priority){

        return res.status(400).json({

            message:"Shelter and priority required"

        });

    }



    const allowedPriority=[

        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL"

    ];



    if(!allowedPriority.includes(priority)){


        return res.status(400).json({

            message:"Invalid priority"

        });

    }




    const insertRequest = ()=>{


        const request_code =
        "REQ-" + Date.now();



        const sql = `

            INSERT INTO relief_requests

            (

                request_code,
                shelter_id,
                priority,
                status,
                requested_by,
                notes

            )

            VALUES(?,?,?,?,?,?)

        `;



        db.query(

            sql,

            [

                request_code,
                shelter_id,
                priority,
                "REQUESTED",
                user_id,
                notes || null

            ],


            (err,result)=>{


                if(err){

                    console.log(err);

                    return res.status(500).json({

                        message:"Database error"

                    });

                }



                return res.status(201).json({

                    message:
                    "Relief request created successfully",

                    request_id:
                    result.insertId,

                    request_code


                });


            }

        );


    };






    // ADMIN

    if(role_id===1){

        return insertRequest();

    }





    // SHELTER MANAGER

    if(role_id===2){


        const checkSql = `

            SELECT shelter_id

            FROM shelter_managers

            WHERE user_id=?

            AND shelter_id=?

        `;



        db.query(

            checkSql,

            [

                user_id,
                shelter_id

            ],


            (err,result)=>{


                if(err){

                    console.log(err);

                    return res.status(500).json({

                        message:"Database error"

                    });

                }




                if(result.length===0){


                    return res.status(403).json({

                        message:
                        "You cannot create request for this shelter"

                    });


                }





                insertRequest();


            }


        );


        return;

    }





    return res.status(403).json({

        message:"Access denied"

    });


};


// =================================
// UPDATE STATUS
// =================================


const updateRequestStatus = (req,res)=>{


    const {

        request_id,
        status

    } = req.body;



    const user_id=req.user.user_id;

    const role_id=req.user.role_id;



    if(!request_id || !status){

        return res.status(400).json({

            message:"Request id and status required"

        });

    }





    const allowedStatus=[

        "APPROVED",
        "CANCELLED"

    ];



    if(!allowedStatus.includes(status)){


        return res.status(400).json({

            message:
            "Invalid status update"

        });

    }





    // only admin / relief manager

    if(role_id!==1 && role_id!==3){


        return res.status(403).json({

            message:
            "You cannot update request status"

        });

    }





    const sql = `

        SELECT status

        FROM relief_requests

        WHERE request_id=?

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



            if(result.length===0){

                return res.status(404).json({

                    message:"Request not found"

                });

            }





            const currentStatus=result[0].status;



            if(

                currentStatus==="COMPLETED" ||
                currentStatus==="CANCELLED"

            ){

                return res.status(400).json({

                    message:
                    "Request already closed"

                });

            }






            const updateSql = `

            UPDATE relief_requests

            SET

            status=?,

            approved_by=?,

            approved_at=NOW()

            WHERE request_id=?

            `;




            db.query(

                updateSql,

                [

                    status,
                    user_id,
                    request_id

                ],


                (err)=>{


                    if(err){

                        return res.status(500).json({

                            message:
                            "Database error"

                        });

                    }



                    res.json({

                        message:
                        "Request status updated successfully"

                    });



                }


            );



        }


    );



};




module.exports={


    getAllRequests,

    createRequest,

    updateRequestStatus


};