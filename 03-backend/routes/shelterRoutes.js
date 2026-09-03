const express = require("express");

const router = express.Router();


const {
    getAllShelters
} = require("../controllers/shelterController");



router.get("/", getAllShelters);



module.exports = router;