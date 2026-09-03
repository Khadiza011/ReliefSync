const express = require("express");

const router = express.Router();


const {
    getAllFamilies
} = require("../controllers/familyController");



router.get("/", getAllFamilies);



module.exports = router;