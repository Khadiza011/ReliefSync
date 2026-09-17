const express = require("express");

const router = express.Router();


const {

    getAllRequests,

    createRequest,

    updateRequestStatus

} = require("../controllers/reliefRequestController");


router.get("/", getAllRequests);


router.post("/", createRequest);
router.put(
    "/status",
    updateRequestStatus
);


module.exports = router;