const express = require("express");

const router = express.Router();

const {
    getAllFamilies,
    createFamily
} = require("../controllers/familyController");


router.get(
    "/",
    getAllFamilies
);


router.post(
    "/",
    createFamily
);


module.exports = router;