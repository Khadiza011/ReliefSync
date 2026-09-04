const express = require("express");

const router = express.Router();


const {
    getAllRequests,
    createRequest
} = require("../controllers/reliefRequestController");



router.get("/", getAllRequests);


router.post("/", createRequest);



module.exports = router;