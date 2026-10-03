const express = require("express");

const router = express.Router();


const {

    getInventory,

    reduceInventory,

    addInventory,

    addNewInventoryItem,

    getLowStock,

    reportLowStock,

    getMyStockReports,

    acknowledgeStockReport

} = require("../controllers/inventoryController");

const {
    verifyToken
} = require("../middleware/authMiddleware");

const {
    checkRole
} = require("../middleware/roleMiddleware");

// VIEW INVENTORY
// ADMIN + SHELTER_MANAGER + RELIEF_MANAGER + VOLUNTEER

router.get(
    "/",
    verifyToken,
    checkRole(1,2,3,4),
    getInventory
);

// LOW STOCK VIEW
// ADMIN + SHELTER_MANAGER + RELIEF_MANAGER

router.get(
    "/low-stock",
    verifyToken,
    checkRole(1,2,3),
    getLowStock
);



// VOLUNTEER: REPORT A LOW / EMPTY ITEM FROM THEIR ACTIVE SHELTER
router.post(
    "/:inventoryId/report-low-stock",
    verifyToken,
    checkRole(4),
    reportLowStock
);

// SHELTER MANAGER: VIEW REPORTS SENT BY VOLUNTEERS FOR THEIR SHELTER
router.get(
    "/stock-reports/mine",
    verifyToken,
    checkRole(2),
    getMyStockReports
);

// SHELTER MANAGER: ACKNOWLEDGE ONE REPORT
router.put(
    "/stock-reports/:reportId/acknowledge",
    verifyToken,
    checkRole(2),
    acknowledgeStockReport
);

// ADMIN + SHELTER_MANAGER + RELIEF_MANAGER

// ADD INVENTORY
router.post(
    "/add",
    verifyToken,
    checkRole(1,2,3),
    addInventory
);

// CREATE A BRAND NEW CATALOGUE ITEM AND ADD ITS FIRST STOCK LINE
router.post(
    "/add-new-item",
    verifyToken,
    checkRole(1,2,3),
    addNewInventoryItem
);

// REDUCE INVENTORY
// ADMIN + SHELTER_MANAGER + RELIEF_MANAGER
router.put(
    "/reduce",
    verifyToken,
    checkRole(1,2,3),
    reduceInventory
);

module.exports = router;