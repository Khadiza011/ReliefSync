const express = require("express");

const router = express.Router();


const {
    createDistribution
} = require("../controllers/distributionController");



router.post("/", createDistribution);



module.exports = router;