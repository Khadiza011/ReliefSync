const express = require("express");

const {
    getAlerts
} = require("../controllers/alertsController");

const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

const router = express.Router();

// Authorized operational users can view alerts
router.get(
    "/",
    verifyToken,
    checkRole(1, 2, 3),
    getAlerts
);

module.exports = router;