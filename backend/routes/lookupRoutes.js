const express = require("express");

const router = express.Router();

const {
    getItems,
    getItemCategories,
    getDonors
} = require("../controllers/lookupController");

const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");


// Reference data used by inventory, request and donation forms

router.get(
    "/items",
    verifyToken,
    getItems
);

router.get(
    "/item-categories",
    verifyToken,
    getItemCategories
);

router.get(
    "/donors",
    verifyToken,
    checkRole(1, 3, 5),
    getDonors
);


module.exports = router;
