const db = require("../config/db");


// =================================
// GET ALL VOLUNTEERS
// =================================

const getAllVolunteers = (req,res)=>{


    const sql = `
        SELECT *
        FROM volunteers
        ORDER BY created_at DESC
    `;


    db.query(sql,(err,result)=>{


        if(err){

            return res.status(500).json({
                message:"Database error",
                error:err.message
            });

        }


        res.json(result);


    });

};



// =================================
// GET AVAILABLE VOLUNTEERS
// =================================

const getAvailableVolunteers = (req,res)=>{


    const sql = `

        SELECT *

        FROM volunteers

        WHERE availability='AVAILABLE'

    `;


    db.query(sql,(err,result)=>{


        if(err){

            return res.status(500).json({
                message:"Database error",
                error:err.message
            });

        }


        res.json(result);


    });

};



// =================================
// ADD VOLUNTEER
// =================================

const createVolunteer = (req,res)=>{


    const {

        volunteer_code,
        volunteer_name,
        phone,
        email

    } = req.body;



    const sql = `

        INSERT INTO volunteers

        (
            volunteer_code,
            volunteer_name,
            phone,
            email
        )

        VALUES (?,?,?,?)

    `;



    db.query(

        sql,

        [
            volunteer_code,
            volunteer_name,
            phone,
            email
        ],

        (err,result)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error",
                    error:err.message

                });

            }


            res.json({

                message:"Volunteer added successfully",

                volunteer_id:result.insertId

            });


        }

    );


};



// =================================
// UPDATE VOLUNTEER
// =================================

const updateVolunteer = (req,res)=>{


    const {id}=req.params;


    const {

        volunteer_name,
        phone,
        email,
        availability

    }=req.body;



    const sql = `

        UPDATE volunteers

        SET

        volunteer_name=?,
        phone=?,
        email=?,
        availability=?

        WHERE volunteer_id=?

    `;


    db.query(

        sql,

        [
            volunteer_name,
            phone,
            email,
            availability,
            id
        ],

        (err)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error",
                    error:err.message

                });

            }


            res.json({

                message:"Volunteer updated successfully"

            });


        }

    );


};



// =================================
// DELETE VOLUNTEER
// =================================

const deleteVolunteer = (req,res)=>{


    const {id}=req.params;


    const sql=`

        DELETE FROM volunteers

        WHERE volunteer_id=?

    `;


    db.query(

        sql,

        [id],

        (err)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error"

                });

            }


            res.json({

                message:"Volunteer deleted successfully"

            });


        }

    );


};



// =================================
// ADD SKILL TO VOLUNTEER
// =================================

const addVolunteerSkill = (req,res)=>{


    const {

        volunteer_id,
        skill_id

    } = req.body;



    const checkSql = `

        SELECT *

        FROM volunteer_skills

        WHERE volunteer_id = ?

        AND skill_id = ?

    `;



    db.query(

        checkSql,

        [
            volunteer_id,
            skill_id
        ],

        (err,result)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error",
                    error:err.message

                });

            }



            if(result.length > 0){

                return res.status(400).json({

                    message:"Skill already assigned"

                });

            }



            const sql = `

                INSERT INTO volunteer_skills

                (
                    volunteer_id,
                    skill_id
                )

                VALUES (?,?)

            `;



            db.query(

                sql,

                [
                    volunteer_id,
                    skill_id
                ],

                (err,result)=>{


                    if(err){


                        if(err.code === "ER_DUP_ENTRY"){

                            return res.status(400).json({

                                message:"Skill already assigned"

                            });

                        }


                        return res.status(500).json({

                            message:"Database error",
                            error:err.message

                        });

                    }



                    res.json({

                        message:"Skill assigned successfully"

                    });


                }

            );


        }

    );


};


// =================================
// REMOVE VOLUNTEER SKILL
// =================================

const removeVolunteerSkill = (req,res)=>{


    const {

        volunteer_id,
        skill_id

    }=req.body;



    const sql=`

        DELETE FROM volunteer_skills

        WHERE volunteer_id=?

        AND skill_id=?

    `;


    db.query(

        sql,

        [
            volunteer_id,
            skill_id
        ],

        (err)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error"

                });

            }


            res.json({

                message:"Skill removed successfully"

            });


        }

    );


};



module.exports={

getAllVolunteers,

getAvailableVolunteers,

createVolunteer,

updateVolunteer,

deleteVolunteer,

addVolunteerSkill,

removeVolunteerSkill

};