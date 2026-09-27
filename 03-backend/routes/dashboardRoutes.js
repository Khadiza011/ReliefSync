const express = require("express");

const {
    getDashboardSummary
} = require("../controllers/dashboardController");

const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

const router = express.Router();

// Dashboard is for authorized operational roles
router.get(
    "/summary",
    verifyToken,
    checkRole(1, 2, 3),
    getDashboardSummary
);

module.exports = router;