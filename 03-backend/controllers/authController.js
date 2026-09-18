const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// =================================
// REGISTER USER
// ONLY VOLUNTEER AND DONOR
// =================================

const register = (req, res) => {


    const {

        full_name,
        email,
        password,
        phone,
        role

    } = req.body;



    if(
        !full_name ||
        !email ||
        !password ||
        !role
    ){

        return res.status(400).json({

            message:"Required fields missing"

        });

    }



    const allowedRoles = {

        VOLUNTEER: 4,

        DONOR: 5

    };



    const roleName = role.toUpperCase();



    if(!allowedRoles[roleName]){

        return res.status(400).json({

            message:
            "Only VOLUNTEER and DONOR registration allowed"

        });

    }



    const role_id = allowedRoles[roleName];



    const normalizedEmail =
    email.toLowerCase().trim();



    const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



    if(!emailRegex.test(normalizedEmail)){


        return res.status(400).json({

            message:"Invalid email format"

        });

    }



    if(password.length < 6){


        return res.status(400).json({

            message:
            "Password must be at least 6 characters"

        });

    }




    const checkEmailSql = `

        SELECT user_id

        FROM users

        WHERE email = ?

    `;



    db.query(

        checkEmailSql,

        [normalizedEmail],

        (err,result)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error"

                });

            }



            if(result.length > 0){

                return res.status(400).json({

                    message:"Email already exists"

                });

            }





            bcrypt.hash(

                password,

                10,

                (err,hash)=>{


                    if(err){

                        return res.status(500).json({

                            message:
                            "Password hashing failed"

                        });

                    }





                    const insertSql = `

                    INSERT INTO users

                    (

                        role_id,

                        full_name,

                        email,

                        password_hash,

                        phone

                    )

                    VALUES(?,?,?,?,?)

                    `;



                    db.query(

                        insertSql,

                        [

                            role_id,

                            full_name,

                            normalizedEmail,

                            hash,

                            phone || null

                        ],

                        (err,result)=>{


                            if(err){

                                return res.status(500).json({

                                    message:
                                    "User registration failed",

                                    error:err.message

                                });

                            }



                            res.status(201).json({

                                message:
                                "User registered successfully",

                                user_id:
                                result.insertId,

                                role:roleName

                            });


                        }

                    );



                }

            );



        }

    );


};





// =================================
// LOGIN USER
// =================================

const login = (req,res)=>{


    const {

        email,
        password

    } = req.body;



    if(!email || !password){


        return res.status(400).json({

            message:
            "Email and password required"

        });

    }



    const normalizedEmail =
    email.toLowerCase().trim();



    const sql = `

        SELECT

            user_id,

            role_id,

            full_name,

            email,

            password_hash,

            status

        FROM users

        WHERE email = ?

    `;



    db.query(

        sql,

        [normalizedEmail],

        (err,result)=>{


            if(err){

                return res.status(500).json({

                    message:"Database error"

                });

            }



            if(result.length === 0){


                return res.status(401).json({

                    message:
                    "Invalid email or password"

                });

            }



            const user = result[0];



            if(user.status !== "ACTIVE"){


                return res.status(403).json({

                    message:
                    "Account is inactive"

                });

            }




            bcrypt.compare(

                password,

                user.password_hash,

                (err,isMatch)=>{


                    if(err){

                        return res.status(500).json({

                            message:
                            "Password verification failed"

                        });

                    }



                    if(!isMatch){

                        return res.status(401).json({

                            message:
                            "Invalid email or password"

                        });

                    }





                    const token = jwt.sign(

                        {

                            user_id:user.user_id,

                            role_id:user.role_id

                        },

                        process.env.JWT_SECRET,

                        {

                            expiresIn:"1d"

                        }

                    );





                    res.json({

                        message:
                        "Login successful",

                        token,

                        user:{

                            user_id:user.user_id,

                            full_name:user.full_name,

                            email:user.email,

                            role_id:user.role_id

                        }

                    });



                }

            );



        }

    );


};





module.exports = {

    register,

    login

};