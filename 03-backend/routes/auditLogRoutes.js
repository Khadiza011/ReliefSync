const express = require("express");

const {
    getAuditLogs
} = require("../controllers/auditLogController");

const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/",
    verifyToken,
    checkRole(1, 2),
    getAuditLogs
);

module.exports = router;