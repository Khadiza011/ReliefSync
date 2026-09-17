const express = require("express");

const router = express.Router();


const {
    getAllShelters,
    getAvailableShelters,
    recommendShelter
} = require("../controllers/shelterController");


router.get("/", getAllShelters);
router.get("/available", getAvailableShelters);
router.get("/recommend", recommendShelter);



module.exports = router;