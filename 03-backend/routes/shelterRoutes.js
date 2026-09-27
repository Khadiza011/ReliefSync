const express = require("express");

const router = express.Router();

const {
    getAllShelters,
    getAvailableShelters,
    recommendShelter
} = require("../controllers/shelterController");

const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");


// ==========================================
// VIEW ALL SHELTERS
// ==========================================

router.get(
    "/",
    verifyToken,
    checkRole(1, 2, 3),
    getAllShelters
);


// ==========================================
// VIEW AVAILABLE SHELTERS
// ==========================================

router.get(
    "/available",
    verifyToken,
    checkRole(1, 2, 3),
    getAvailableShelters
);


// ==========================================
// RECOMMEND SHELTER
// ==========================================

router.get(
    "/recommend",
    verifyToken,
    checkRole(1, 2, 3),
    recommendShelter
);


module.exports = router;