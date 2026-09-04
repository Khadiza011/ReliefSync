const db = require("../config/db");


// CREATE DISTRIBUTION

const createDistribution = (req, res) => {


    const {
        request_id,
        distributed_by,
        notes
    } = req.body;



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

        VALUES
        (
            ?,
            ?,
            'COMPLETED',
            ?,
            ?
        )
    `;



    db.query(
        sql,
        [
            distribution_code,
            request_id,
            distributed_by,
            notes
        ],

        (err, result)=>{


            if(err){

                console.log(err);

                return res.status(500).json({

                    message:"Database error",

                    error:err.sqlMessage

                });

            }



            res.json({

                message:"Distribution created successfully",

                distribution_id: result.insertId,

                distribution_code: distribution_code

            });


        }

    );


};



module.exports = {

    createDistribution

};