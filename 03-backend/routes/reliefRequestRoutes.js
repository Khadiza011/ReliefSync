const express = require("express");

const router = express.Router();


const {

    getAllRequests,
    createRequest,
    updateRequestStatus

} = require("../controllers/reliefRequestController");



const {

    verifyToken

} = require("../middleware/authMiddleware");



const {

    checkRole

} = require("../middleware/roleMiddleware");




// GET ALL REQUESTS

router.get(
    "/",
    verifyToken,
    checkRole(1,2,3),
    getAllRequests
);




// CREATE REQUEST

router.post(
    "/",
    verifyToken,
    checkRole(1,2),
    createRequest
);




// APPROVE / CANCEL REQUEST

router.put(
    "/status",
    verifyToken,
    checkRole(1,3),
    updateRequestStatus
);



module.exports = router;