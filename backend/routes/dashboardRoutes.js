const express = require("express");
const { getDashboardSummary, getNotifications } = require("../controllers/dashboardController");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/summary", verifyToken, checkRole(1, 2, 3), getDashboardSummary);
// Every authenticated ReliefSync role gets a live, role-aware notification feed.
router.get("/notifications", verifyToken, checkRole(1, 2, 3, 4, 5), getNotifications);

module.exports = router;
