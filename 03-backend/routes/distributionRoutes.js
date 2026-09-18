const express = require("express");

const router = express.Router();


const {
    createDistribution
} = require("../controllers/distributionController");


const { 
    verifyToken 
} = require("../middleware/authMiddleware");


const {
    checkRole
} = require("../middleware/roleMiddleware");



router.post(

    "/",

    verifyToken,

    checkRole(1,3),

    createDistribution

);



module.exports = router;