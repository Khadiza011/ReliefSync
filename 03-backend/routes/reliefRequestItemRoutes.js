const express = require("express");

const router = express.Router();



const {

    addRequestItem,

    getRequestItems,

    updateFulfilledQty


} = require("../controllers/reliefRequestItemController");





// Add item to request

router.post(

    "/",

    addRequestItem

);




// Get items of a request

router.get(

    "/:request_id",

    getRequestItems

);




// Update fulfilled quantity

router.put(

    "/fulfill",

    updateFulfilledQty

);



module.exports = router;