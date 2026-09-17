const db = require("../config/db");


// Get all families
const getAllFamilies = (req, res) => {


    const sql = `
        SELECT
            family_id,
            family_code,
            contact_phone,
            current_district,
            current_area,
            priority,
            status
        FROM families
    `;


    db.query(sql, (err, result) => {


        if (err) {

            console.log(err);

            return res.status(500).json({
                message: "Database error"
            });

        }


        res.json(result);


    });

};

// =================================
// CREATE FAMILY
// =================================

const createFamily = (req,res)=>{


    const {

        family_code,
        contact_phone,
        current_district,
        current_area,
        priority

    } = req.body;



    // Check duplicate family code

    const checkSql = `

        SELECT family_id

        FROM families

        WHERE family_code = ?

    `;



    db.query(

        checkSql,

        [family_code],

        (err,result)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error",
                    error:err.message

                });

            }



            // Already exists

            if(result.length > 0){

                return res.status(400).json({

                    message:"Family already registered"

                });

            }



            // Insert new family

            const sql = `

                INSERT INTO families

                (

                    family_code,
                    contact_phone,
                    current_district,
                    current_area,
                    priority

                )

                VALUES (?,?,?,?,?)

            `;



            db.query(

                sql,

                [

                    family_code,
                    contact_phone,
                    current_district,
                    current_area,
                    priority

                ],

                (err,result)=>{


                    if(err){


                        // Database level duplicate protection

                        if(err.code === "ER_DUP_ENTRY"){

                            return res.status(400).json({

                                message:"Family already registered"

                            });

                        }



                        return res.status(500).json({

                            message:"Database error",
                            error:err.message

                        });


                    }



                    res.json({

                        message:"Family registered successfully",

                        family_id:result.insertId

                    });


                }

            );


        }

    );


};

module.exports = {

    getAllFamilies,

    createFamily

};