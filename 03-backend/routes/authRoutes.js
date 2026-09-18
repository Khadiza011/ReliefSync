const express = require("express");

const router = express.Router();

const {

    register,
    login

} = require("../controllers/authController");

const { 
    verifyToken 

} = require("../middleware/authMiddleware");

router.post(
    "/register",
    register
);
router.post(
    "/login",
    login
);

// =================================
// GET USER PROFILE (PROTECTED)
// =================================

router.get(

    "/profile",

    verifyToken,

    (req,res)=>{


        res.json({

            message:"Protected route accessed successfully",

            user:req.user

        });


    }

);

const {
    checkRole
} = require("../middleware/roleMiddleware");

// =================================
// ADMIN ONLY TEST ROUTE
// =================================

router.get(

    "/admin-test",

    verifyToken,

    checkRole(1),

    (req,res)=>{


        res.json({

            message:"Welcome Admin",

            user:req.user

        });


    }

);


module.exports = router;