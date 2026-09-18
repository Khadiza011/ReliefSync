const express = require("express");

const router = express.Router();


const {

    getAllVolunteers,
    getAvailableVolunteers,
    createVolunteer,
    updateVolunteer,
    deleteVolunteer,
    addVolunteerSkill,
    removeVolunteerSkill

} = require("../controllers/volunteerController");

const {verifyToken}=require("../middleware/authMiddleware");
const {checkRole}=require("../middleware/roleMiddleware");

router.get(
"/",
verifyToken,
checkRole(1,3),
getAllVolunteers
);


router.post(
"/",
verifyToken,
checkRole(1,3),
createVolunteer
);


router.put(
"/:id",
verifyToken,
checkRole(1,3),
updateVolunteer
);


router.delete(
"/:id",
verifyToken,
checkRole(1,3),
deleteVolunteer
);


router.post(
"/skill",
verifyToken,
checkRole(1,3),
addVolunteerSkill
);


router.delete(
"/skill",
verifyToken,
checkRole(1,3),
removeVolunteerSkill
);

router.get(
"/available",
verifyToken,
checkRole(1,3),
getAvailableVolunteers
);

module.exports = router;