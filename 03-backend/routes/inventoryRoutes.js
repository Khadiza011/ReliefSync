const express = require("express");

const router = express.Router();


const {

    getInventory,

    reduceInventory,

    addInventory,

    getLowStock

} = require("../controllers/inventoryController");

router.get("/", getInventory);

router.get("/low-stock",getLowStock);

router.put("/reduce", reduceInventory);

router.post("/add",addInventory);

module.exports = router;