const db = require("../config/db");


// =================================
// GET ALL FAMILIES
// =================================

const getAllFamilies = (req, res) => {

    const sql = `

        SELECT

            family_id,
            family_code,
            contact_phone,
            current_district,
            current_area,
            priority,
            status,
            registered_by,
            registered_at

        FROM families

        ORDER BY registered_at DESC

    `;

    db.query(sql, (err, result) => {

        if(err){

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

const createFamily = (req, res) => {

    const {

        family_code,
        contact_phone,
        current_district,
        current_area,
        priority

    } = req.body;


    const registered_by = req.user.user_id;


    // ===============================
// REQUIRED FIELD VALIDATION
// ===============================

    if(
        !family_code ||
        !contact_phone ||
        !current_district ||
        !current_area ||
        !priority
    ){

        return res.status(400).json({

            message: "All fields are required"

        });

    }


    const cleanFamilyCode = family_code.trim();


    // ===============================
// PRIORITY VALIDATION
// ===============================

    const allowedPriority = [

        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL"

    ];


    if(!allowedPriority.includes(priority)){

        return res.status(400).json({

            message: "Invalid priority"

        });

    }


    // ===============================
// CHECK DUPLICATE FAMILY CODE
// ===============================

    const checkSql = `

        SELECT family_id

        FROM families

        WHERE family_code = ?

    `;


    db.query(

        checkSql,

        [
            cleanFamilyCode
        ],

        (err, result) => {

            if(err){

                console.log(err);

                return res.status(500).json({

                    message: "Database error"

                });

            }


            if(result.length > 0){

                return res.status(400).json({

                    message: "Family already registered"

                });

            }


            // ===============================
            // INSERT FAMILY
            // ===============================

            const insertSql = `

                INSERT INTO families

                (
                    family_code,
                    contact_phone,
                    current_district,
                    current_area,
                    priority,
                    registered_by
                )

                VALUES (?,?,?,?,?,?)

            `;


            db.query(

                insertSql,

                [
                    cleanFamilyCode,
                    contact_phone,
                    current_district,
                    current_area,
                    priority,
                    registered_by
                ],

                (err, result) => {

                    if(err){

                        console.log(err);


                        if(err.code === "ER_DUP_ENTRY"){

                            return res.status(400).json({

                                message:
                                "Family already registered"

                            });

                        }


                        return res.status(500).json({

                            message: "Database error"

                        });

                    }


                    res.status(201).json({

                        message:
                        "Family registered successfully",

                        family_id:
                        result.insertId,

                        registered_by

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