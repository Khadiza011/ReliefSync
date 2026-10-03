const express = require("express");

const router = express.Router();


const {
    getAllDonations,
    createDonation,
    receiveDonation
} = require("../controllers/donationController");


const {
    verifyToken
} = require("../middleware/authMiddleware");


const {
    checkRole
} = require("../middleware/roleMiddleware");


router.get(
    "/",
    verifyToken,
    checkRole(1, 2, 3, 5),
    getAllDonations
);

router.post(
    "/",
    verifyToken,
    checkRole(1, 5),
    createDonation
);

router.put(
    "/:id/receive",
    verifyToken,
    checkRole(1, 3),
    receiveDonation
);


module.exports = router;