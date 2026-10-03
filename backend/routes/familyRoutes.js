const express = require("express");

const router = express.Router();

const {
    getAllFamilies,
    createFamily,
    getFamilyMembers,
    getFamilyMemberCapacity,
    addFamilyMember,
    removeFamilyMember,
    removeFamily
} = require("../controllers/familyController");

const {verifyToken}=require("../middleware/authMiddleware");
const {checkRole}=require("../middleware/roleMiddleware");

router.get(
"/",
verifyToken,
checkRole(1,2,3),
getAllFamilies
);


router.post(
    "/",
    verifyToken,
    checkRole(1,2),
    createFamily
);


router.get(
    "/:id/members",
    verifyToken,
    checkRole(1,2,3),
    getFamilyMembers
);




router.get(
    "/:id/member-capacity",
    verifyToken,
    checkRole(1,2,3),
    getFamilyMemberCapacity
);

router.post(
    "/:id/members",
    verifyToken,
    checkRole(1,2),
    addFamilyMember
);


// Only administrators may remove a family or one of its members
router.delete(
    "/:id/members/:memberId",
    verifyToken,
    checkRole(1),
    removeFamilyMember
);

router.delete(
    "/:id",
    verifyToken,
    checkRole(1),
    removeFamily
);


module.exports = router;