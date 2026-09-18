const express = require("express");

const router = express.Router();


const {
    getMedicalTeams,
    createMedicalRequest,
    assignMedicalSupport,
    getMedicalRequests,
    updateMedicalAssignmentStatus,
    findVolunteerBySkill

} = require("../controllers/medicalController");

const {verifyToken}=require("../middleware/authMiddleware");
const {checkRole}=require("../middleware/roleMiddleware");

router.get(
"/teams",
verifyToken,
checkRole(1,3),
getMedicalTeams
);


router.post(
"/request",
verifyToken,
checkRole(1,2,3),
createMedicalRequest
);


router.post(
"/assign",
verifyToken,
checkRole(1,3),
assignMedicalSupport
);


router.get(
"/requests",
verifyToken,
checkRole(1,2,3),
getMedicalRequests
);


router.put(
"/assignment/status",
verifyToken,
checkRole(1,3),
updateMedicalAssignmentStatus
);


router.get(
"/find-volunteer",
verifyToken,
checkRole(1,3),
findVolunteerBySkill
);

module.exports = router;