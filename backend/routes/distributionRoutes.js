const express = require("express");

const router = express.Router();


const {
    getAllDistributions,
    createDistribution
} = require("../controllers/distributionController");


const { 
    verifyToken 
} = require("../middleware/authMiddleware");


const {
    checkRole
} = require("../middleware/roleMiddleware");


router.get(
    "/",
    verifyToken,
    checkRole(1, 2, 3),
    getAllDistributions
);

router.post(
    "/",
    verifyToken,
    checkRole(1, 3),
    createDistribution
);


module.exports = router;