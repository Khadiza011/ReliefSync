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



// Get all volunteers
router.get(
    "/",
    getAllVolunteers
);


// Get available volunteers
router.get(
    "/available",
    getAvailableVolunteers
);


// Add new volunteer
router.post(
    "/",
    createVolunteer
);


// Update volunteer
router.put(
    "/:id",
    updateVolunteer
);


// Delete volunteer
router.delete(
    "/:id",
    deleteVolunteer
);


// Assign skill to volunteer
router.post(
    "/skill",
    addVolunteerSkill
);


// Remove skill from volunteer
router.delete(
    "/skill",
    removeVolunteerSkill
);


module.exports = router;