const db = require("../config/db");


// =================================
// CREATE DISTRIBUTION
// =================================

const createDistribution = (req,res)=>{


    const {

        request_id,
        notes

    } = req.body;



    const distributed_by = req.user.user_id;



    if(!request_id){


        return res.status(400).json({

            message:"Request id is required"

        });

    }




    // Check request exists and status

    const checkSql = `

        SELECT

            request_id,

            status


        FROM relief_requests


        WHERE request_id = ?

    `;



    db.query(

        checkSql,

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





            if(result[0].status !== "APPROVED"){


                return res.status(400).json({

                    message:
                    "Only approved request can be distributed"

                });

            }







            const distribution_code =
            "DIST-" + Date.now();





            const sql = `

                INSERT INTO distributions

                (

                    distribution_code,

                    request_id,

                    status,

                    distributed_by,

                    notes

                )


                VALUES(?,?,?,?,?)

            `;




            db.query(

                sql,

                [

                    distribution_code,

                    request_id,

                    "PENDING",

                    distributed_by,

                    notes || null

                ],


                (err,result)=>{


                    if(err){


                        return res.status(500).json({

                            message:"Database error"

                        });


                    }





                    res.status(201).json({

                        message:
                        "Distribution created successfully",


                        distribution_id:
                        result.insertId,


                        distribution_code


                    });



                }


            );



        }


    );



};




module.exports={

    createDistribution

};