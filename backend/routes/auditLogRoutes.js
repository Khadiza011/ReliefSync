const express = require("express");

const router = express.Router();

const { getAuditLogs, getInventoryTransactions } = require("../controllers/auditLogController");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

router.get(
    "/",
    verifyToken,
    checkRole(1),
    getAuditLogs
);

router.get(
    "/inventory-transactions",
    verifyToken,
    checkRole(1),
    getInventoryTransactions
);

module.exports = router;