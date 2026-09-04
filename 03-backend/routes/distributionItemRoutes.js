const express = require("express");

const router = express.Router();


const {
    addDistributionItem
} = require("../controllers/distributionItemController");



router.post("/", addDistributionItem);



module.exports = router;