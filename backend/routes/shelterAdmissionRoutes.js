const express = require("express");

const router = express.Router();


const {

    createAdmission,
    dischargeAdmission,
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



router.put(
"/:id/discharge",
verifyToken,
checkRole(1,2),
dischargeAdmission
);



router.get(
"/",
verifyToken,
checkRole(1,2,3),
getAllAdmissions
);



module.exports = router;