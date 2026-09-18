const express = require("express");

const router = express.Router();


const {

    getInventory,

    reduceInventory,

    addInventory,

    getLowStock

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


// ADMIN + SHELTER_MANAGER + RELIEF_MANAGER

// ADD INVENTORY
router.post(
    "/add",
    verifyToken,
    checkRole(1,2,3),
    addInventory
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