const express = require("express");

const router = express.Router();


const {

    createDonation,

    receiveDonation

} = require("../controllers/donationController");



const {

    verifyToken

} = require("../middleware/authMiddleware");



const {

    checkRole

} = require("../middleware/roleMiddleware");





// =================================
// CREATE DONATION
// =================================

// DONOR / ADMIN

router.post(

    "/",

    verifyToken,

    checkRole(1,5),

    createDonation

);







// =================================
// RECEIVE DONATION
// =================================

// ADMIN / RELIEF MANAGER

router.put(

    "/:id/receive",

    verifyToken,

    checkRole(1,3),

    receiveDonation

);


module.exports = router;