const express = require("express");

const router = express.Router();


const {

    getAllVolunteers,
    getVolunteerDirectory,
    approveVolunteer,
    assignVolunteer,
    getAvailableVolunteers,
    getMyVolunteerProfile,
    getMyShelterPeople,
    completeMyAssignment,
    createVolunteer,
    updateVolunteer,
    deleteVolunteer,
    addVolunteerSkill,
    removeVolunteerSkill,
    getSkillCatalog,
    updateMySkills

} = require("../controllers/volunteerController");

const {verifyToken}=require("../middleware/authMiddleware");
const {checkRole}=require("../middleware/roleMiddleware");

// Volunteer account: own profile, skills and assignments
router.get(
"/me",
verifyToken,
checkRole(4),
getMyVolunteerProfile
);



router.get(
"/me/shelters/:shelterId/families",
verifyToken,
checkRole(4),
getMyShelterPeople
);

router.put(
"/me/assignments/:assignmentId/complete",
verifyToken,
checkRole(4),
completeMyAssignment
);

router.get(
"/me/skills/catalog",
verifyToken,
checkRole(4),
getSkillCatalog
);

router.put(
"/me/skills",
verifyToken,
checkRole(4),
updateMySkills
);


router.get(
"/",
verifyToken,
checkRole(1,3),
getVolunteerDirectory
);


router.put(
"/:id/approve",
verifyToken,
checkRole(1),
approveVolunteer
);

router.post(
"/:id/assign",
verifyToken,
checkRole(1,3),
assignVolunteer
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