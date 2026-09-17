const db = require("../config/db");


// ===============================
// GET ALL RELIEF REQUESTS
// ===============================

const getAllRequests = (req, res) => {


    const sql = `
        SELECT
            rr.request_id,
            rr.request_code,
            rr.priority,
            rr.status,
            rr.requested_at,
            rr.notes,

            s.shelter_name,
            s.district,
            s.upazila

        FROM relief_requests rr

        JOIN shelters s
        ON rr.shelter_id = s.shelter_id

        ORDER BY rr.requested_at DESC
    `;



    db.query(sql, (err, result) => {


        if (err) {

            console.log(err);

            return res.status(500).json({
                message: "Database error",
                error: err.sqlMessage
            });

        }


        res.json(result);


    });


};





// ===============================
// CREATE RELIEF REQUEST
// ===============================

const createRequest = (req, res) => {


    const {
        shelter_id,
        priority,
        requested_by,
        notes
    } = req.body;



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

        VALUES
        (
            ?,
            ?,
            ?,
            'REQUESTED',
            ?,
            ?
        )
    `;



    db.query(

        sql,

        [
            request_code,
            shelter_id,
            priority,
            requested_by,
            notes
        ],


        (err, result)=>{


            if(err){

                console.log(err);


                return res.status(500).json({

                    message:"Database error",

                    error: err.sqlMessage

                });

            }



            res.json({

                message:"Relief request created successfully",

                request_id: result.insertId,

                request_code: request_code

            });



        }

    );


};

// ===============================
// UPDATE RELIEF REQUEST STATUS
// ===============================

const updateRequestStatus = (req,res)=>{


    const {

        request_id,
        status

    } = req.body;



    const allowedStatus = [

        "REQUESTED",
        "APPROVED",
        "DISTRIBUTED",
        "COMPLETED",
        "CANCELLED"

    ];



    if(!allowedStatus.includes(status)){


        return res.status(400).json({

            message:"Invalid request status"

        });


    }



    const sql = `

        UPDATE relief_requests

        SET status = ?

        WHERE request_id = ?

    `;



    db.query(

        sql,

        [
            status,
            request_id
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

                    message:"Relief request not found"

                });

            }



            res.json({

                message:"Relief request status updated"

            });


        }

    );


};



module.exports = {

    getAllRequests,

    createRequest,

    updateRequestStatus

};