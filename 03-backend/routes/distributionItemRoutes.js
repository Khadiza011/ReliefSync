const express = require("express");

const router = express.Router();


const {
    addDistributionItem
} = require("../controllers/distributionItemController");

const {verifyToken}=require("../middleware/authMiddleware");
const {checkRole}=require("../middleware/roleMiddleware");

router.post(
"/",
verifyToken,
checkRole(1,3),
addDistributionItem
);



module.exports = router;