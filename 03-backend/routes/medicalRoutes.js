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

// Get all medical teams
router.get("/teams", getMedicalTeams);


// Create medical request
router.post("/request", createMedicalRequest);


// Assign medical team
router.post(
    "/assign",
    assignMedicalSupport
);

// Get all medical requests

router.get(
    "/requests",
    getMedicalRequests
);



// Update assignment status

router.put(
    "/assignment/status",
    updateMedicalAssignmentStatus
);

router.get(
    "/find-volunteer",
    findVolunteerBySkill
);

module.exports = router;