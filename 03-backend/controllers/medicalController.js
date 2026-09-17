const db = require("../config/db");


// =================================
// GET ALL MEDICAL TEAMS
// =================================

const getMedicalTeams = (req, res) => {

    const sql = `
        SELECT *
        FROM medical_teams
    `;


    db.query(sql, (err, result)=>{

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
// CREATE MEDICAL REQUEST
// =================================

const createMedicalRequest = (req,res)=>{


    const {
        family_id,
        problem_description,
        priority
    } = req.body;



    if(!family_id || !problem_description || !priority){

        return res.status(400).json({

            message:"Required fields missing"

        });

    }



    const sql = `

        INSERT INTO medical_requests

        (
            family_id,
            problem_description,
            priority
        )

        VALUES (?, ?, ?)

    `;



    db.query(

        sql,

        [
            family_id,
            problem_description,
            priority
        ],

        (err,result)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error",
                    error:err.message

                });

            }



            res.json({

                message:"Medical request created successfully",

                medical_request_id:result.insertId

            });


        }

    );


};





// =================================
// ASSIGN MEDICAL SUPPORT
// =================================

const assignMedicalSupport = (req,res)=>{


    const {

        medical_request_id,
        medical_team_id,
        volunteer_id

    } = req.body;




    // Check volunteer availability first

    const checkVolunteer = (callback)=>{


        if(!volunteer_id){

            return callback();

        }



        const sql = `

            SELECT availability

            FROM volunteers

            WHERE volunteer_id = ?

        `;



        db.query(

            sql,

            [volunteer_id],

            (err,result)=>{


                if(err){

                    return res.status(500).json({

                        message:"Database error",
                        error:err.message

                    });

                }



                if(result.length === 0){

                    return res.status(404).json({

                        message:"Volunteer not found"

                    });

                }



                if(result[0].availability !== "AVAILABLE"){


                    return res.status(400).json({

                        message:"Volunteer is not available"

                    });

                }



                callback();


            }

        );


    };




    const saveAssignment = ()=>{


        const checkSql = `

            SELECT *

            FROM medical_assignments

            WHERE medical_request_id = ?

        `;



        db.query(

            checkSql,

            [medical_request_id],

            (err,result)=>{


                if(err){

                    return res.status(500).json({

                        message:"Database error",
                        error:err.message

                    });

                }



                // Update existing assignment

                if(result.length > 0){


                    const updateSql = `

                        UPDATE medical_assignments

                        SET

                        medical_team_id=?,

                        volunteer_id=?,

                        status='ASSIGNED'

                        WHERE medical_request_id=?

                    `;



                    db.query(

                        updateSql,

                        [
                            medical_team_id || null,
                            volunteer_id || null,
                            medical_request_id
                        ],

                        (err)=>{


                            if(err){

                                return res.status(500).json({

                                    message:"Update error",
                                    error:err.message

                                });

                            }



                            res.json({

                                message:"Medical assignment updated"

                            });


                        }

                    );


                }                // Insert new assignment

                else{


                    const insertSql = `

                        INSERT INTO medical_assignments

                        (
                            medical_request_id,
                            medical_team_id,
                            volunteer_id
                        )

                        VALUES (?,?,?)

                    `;



                    db.query(

                        insertSql,

                        [
                            medical_request_id,
                            medical_team_id || null,
                            volunteer_id || null
                        ],

                        (err,result)=>{


                            if(err){

                                return res.status(500).json({

                                    message:"Database error",
                                    error:err.message

                                });

                            }



                            // Update medical request status

                            const updateRequestSql = `

                                UPDATE medical_requests

                                SET status='ASSIGNED'

                                WHERE medical_request_id=?

                            `;



                            db.query(

                                updateRequestSql,

                                [medical_request_id]

                            );



                            res.json({

                                message:"Medical support assigned successfully",

                                assignment_id:result.insertId

                            });


                        }

                    );


                }


            }

        );


    };



    checkVolunteer(saveAssignment);


};





// =================================
// GET ALL MEDICAL REQUESTS
// =================================

const getMedicalRequests = (req,res)=>{


    const sql = `

        SELECT

        mr.medical_request_id,
        mr.problem_description,
        mr.priority,
        mr.status,
        mr.requested_at,

        f.family_code,
        f.current_district,

        mt.name AS assigned_medical_team,

        v.volunteer_name AS assigned_volunteer,
        v.volunteer_code,
        v.phone AS volunteer_phone


        FROM medical_requests mr


        JOIN families f

        ON mr.family_id=f.family_id


        LEFT JOIN medical_assignments ma

        ON mr.medical_request_id=ma.medical_request_id


        LEFT JOIN medical_teams mt

        ON ma.medical_team_id=mt.medical_team_id


        LEFT JOIN volunteers v

        ON ma.volunteer_id=v.volunteer_id


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
// UPDATE MEDICAL ASSIGNMENT STATUS
// =================================

const updateMedicalAssignmentStatus = (req,res)=>{


    const {

        assignment_id,
        status

    } = req.body;



    const allowedStatus=[

        "ASSIGNED",
        "COMPLETED",
        "CANCELLED"

    ];



    if(!allowedStatus.includes(status)){


        return res.status(400).json({

            message:"Invalid status"

        });


    }




    const sql = `

        UPDATE medical_assignments

        SET status=?

        WHERE assignment_id=?

    `;



    db.query(

        sql,

        [
            status,
            assignment_id
        ],

        (err,result)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error",
                    error:err.message

                });

            }



            // Update medical request status

            const updateRequestSql = `

                UPDATE medical_requests mr

                JOIN medical_assignments ma

                ON mr.medical_request_id=ma.medical_request_id


                SET mr.status=?


                WHERE ma.assignment_id=?

            `;



            db.query(

                updateRequestSql,

                [
                    status,
                    assignment_id
                ]

            );



            // If completed make volunteer available again

            if(status==="COMPLETED"){


                const volunteerSql = `

                    UPDATE volunteers v

                    JOIN medical_assignments ma

                    ON v.volunteer_id=ma.volunteer_id


                    SET v.availability='AVAILABLE'


                    WHERE ma.assignment_id=?

                `;



                db.query(

                    volunteerSql,

                    [assignment_id]

                );


            }



            res.json({

                message:"Medical assignment status updated"

            });



        }

    );


};





// =================================
// FIND VOLUNTEER BY SKILL
// =================================

const findVolunteerBySkill = (req,res)=>{


    const {skill_name}=req.query;



    const sql = `

        SELECT

        v.volunteer_id,
        v.volunteer_code,
        v.volunteer_name,
        v.phone,
        v.availability,
        s.skill_name


        FROM volunteers v


        JOIN volunteer_skills vs

        ON v.volunteer_id=vs.volunteer_id


        JOIN skills s

        ON vs.skill_id=s.skill_id


        WHERE s.skill_name=?


        AND v.availability='AVAILABLE'


    `;



    db.query(

        sql,

        [skill_name],

        (err,result)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error",
                    error:err.message

                });

            }


            res.json(result);


        }

    );


};





module.exports={


    getMedicalTeams,

    createMedicalRequest,

    assignMedicalSupport,

    getMedicalRequests,

    updateMedicalAssignmentStatus,

    findVolunteerBySkill


};