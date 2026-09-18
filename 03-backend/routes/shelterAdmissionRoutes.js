const express = require("express");

const router = express.Router();


const {

    createAdmission,
    getAllAdmissions

} = require("../controllers/shelterAdmissionController");



const {verifyToken}=require("../middleware/authMiddleware");
const {checkRole}=require("../middleware/roleMiddleware");

router.post(
"/",
verifyToken,
checkRole(1,2),
createAdmission
);



router.get(
"/",
verifyToken,
checkRole(1,2,3),
getAllAdmissions
);



module.exports = router;