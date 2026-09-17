const express = require("express");
const router = express.Router();

const syncController = require("../controllers/syncController");


// Save offline data
router.post("/offline", syncController.saveOfflineData);
router.post("/upload", syncController.uploadOfflineData);

module.exports = router;