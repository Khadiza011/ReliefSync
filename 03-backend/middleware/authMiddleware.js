const jwt = require("jsonwebtoken");


// =================================
// VERIFY JWT TOKEN
// =================================

const verifyToken = (req, res, next) => {


    const authHeader = req.headers.authorization;



    if(!authHeader){

        return res.status(401).json({

            message:"Authorization token required"

        });

    }



    if(!authHeader.startsWith("Bearer ")){

    return res.status(401).json({

        message:"Invalid token format"

    });

}


if(!authHeader.startsWith("Bearer ")){

    return res.status(401).json({

        message:"Invalid token format"

    });

}

const token = authHeader.split(" ")[1];

if(!token){

    return res.status(401).json({

        message:"Token missing"

    });

}

    jwt.verify(

        token,

        process.env.JWT_SECRET,

        (err,decoded)=>{


            if(err){

                return res.status(403).json({

                    message:"Invalid or expired token"

                });

            }



            req.user = decoded;


            next();


        }

    );


};





module.exports = {

    verifyToken

};