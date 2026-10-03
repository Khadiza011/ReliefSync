const express = require("express");

const router = express.Router();


const {
    createShelter,
    getAllShelters,
    getMyShelters,
    getShelterFamilies,
    getAvailableShelters,
    recommendShelter,
    getShelterCapacity
} = require("../controllers/shelterController");

const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");


router.get("/", getAllShelters);
router.post("/", verifyToken, checkRole(1), createShelter);
router.get("/mine", verifyToken, checkRole(2), getMyShelters);
router.get("/available", getAvailableShelters);
router.get("/recommend", recommendShelter);
router.get("/:id/capacity", getShelterCapacity);
router.get("/:id/families", verifyToken, checkRole(1, 2, 3), getShelterFamilies);



module.exports = router;