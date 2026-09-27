const express = require("express");

const {
    getReportSummary
} = require("../controllers/reportController");

const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/summary",
    verifyToken,
    checkRole(1, 2),
    getReportSummary
);

module.exports = router;