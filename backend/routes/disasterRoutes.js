const express = require("express");

const router = express.Router();


const {
    getAllDisasters
} = require("../controllers/disasterController");



router.get("/", getAllDisasters);



module.exports = router;