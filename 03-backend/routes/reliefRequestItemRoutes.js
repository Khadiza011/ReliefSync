const express = require("express");

const router = express.Router();


const {
    addRequestItem,
    getRequestItems,
    updateFulfilledQty
} = require("../controllers/reliefRequestItemController");


const {
    verifyToken
} = require("../middleware/authMiddleware");


const {
    checkRole
} = require("../middleware/roleMiddleware");



// Add item

router.post(
    "/",
    verifyToken,
    checkRole(1,2,3),
    addRequestItem
);



// View items

router.get(
    "/:request_id",
    verifyToken,
    checkRole(1,2,3,4),
    getRequestItems
);



// Update fulfilled

router.put(
    "/fulfill",
    verifyToken,
    checkRole(1,3),
    updateFulfilledQty
);


module.exports = router;