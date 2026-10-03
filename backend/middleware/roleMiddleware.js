// =================================
// ROLE AUTHORIZATION MIDDLEWARE
// =================================


const checkRole = (...allowedRoles)=>{


    return (req,res,next)=>{


        if(!req.user){

            return res.status(401).json({

                message:"User authentication required"

            });

        }



        const userRole = req.user.role_id;



        if(!allowedRoles.includes(userRole)){


            return res.status(403).json({

                message:"Access denied. Insufficient permission"

            });


        }

console.log("ROLE CHECK PASSED");

        next();


    };


};



module.exports = {

    checkRole

};