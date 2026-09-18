const express = require("express");

const router = express.Router();


const syncController = require("../controllers/syncController");


const {
verifyToken
}=require("../middleware/authMiddleware");


const {
checkRole
}=require("../middleware/roleMiddleware");



// Save offline data

router.post(
"/offline",
verifyToken,
syncController.saveOfflineData
);



// Upload sync data

router.post(
"/upload",
verifyToken,
checkRole(1,3),
syncController.uploadOfflineData
);


module.exports = router;