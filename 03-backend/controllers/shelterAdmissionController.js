const db = require("../config/db");


// =====================================
// CREATE SHELTER ADMISSION
// =====================================

const createAdmission = (req, res) => {


    const {
        family_id,
        shelter_id,
        admitted_member_count
    } = req.body;


    const user_id = req.user.user_id;
    const role_id = req.user.role_id;



    const insertAdmission = () => {


        const sql = `

            INSERT INTO shelter_admissions
            (
                family_id,
                shelter_id,
                admitted_member_count,
                admitted_by
            )

            VALUES
            (?,?,?,?)

        `;


        db.query(
            sql,
            [
                family_id,
                shelter_id,
                admitted_member_count,
                user_id
            ],

            (err,result)=>{


                if(err){

                    return res.status(500).json({
                        message:"Database error",
                        error:err.message
                    });

                }


                res.json({

                    message:"Family admitted successfully",
                    admission_id:result.insertId

                });


            }
        );

    };



    // ADMIN

    if(role_id === 1){

        return insertAdmission();

    }



    // SHELTER MANAGER

    const checkManager = `

        SELECT *

        FROM shelter_managers

        WHERE user_id = ?

        AND shelter_id = ?

    `;


    db.query(

        checkManager,

        [
            user_id,
            shelter_id
        ],

        (err,result)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error",

                    error:err.message

                });

            }



            if(result.length === 0){

                return res.status(403).json({

                    message:"You cannot manage this shelter"

                });

            }



            insertAdmission();


        }

    );


};



// =====================================
// GET ALL ADMISSIONS
// =====================================

const getAllAdmissions = (req,res)=>{


    const sql = `

    SELECT 
        sa.*,
        s.shelter_name

    FROM shelter_admissions sa

    JOIN shelters s
    ON sa.shelter_id = s.shelter_id

    ORDER BY sa.admitted_at DESC

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



module.exports = {

    createAdmission,
    getAllAdmissions

};