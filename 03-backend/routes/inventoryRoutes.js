const express = require("express");

const router = express.Router();


const {
    getInventory,
    reduceInventory
} = require("../controllers/inventoryController");


router.get("/", getInventory);
router.put("/reduce", reduceInventory);


module.exports = router;