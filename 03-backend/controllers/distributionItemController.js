const db = require("../config/db");


// =================================
// ADD DISTRIBUTION ITEM
// =================================

const addDistributionItem = (req, res) => {

    const {
        distribution_id,
        request_item_id,
        item_id,
        quantity
    } = req.body;


    const created_by = req.user.user_id;


    // =================================
    // REQUIRED FIELD VALIDATION
    // =================================

    if (
        !distribution_id ||
        !request_item_id ||
        !item_id ||
        quantity === undefined ||
        quantity === null
    ) {

        return res.status(400).json({
            message: "Required fields missing"
        });

    }


    // =================================
    // ID VALIDATION
    // =================================

    if (
        Number(distribution_id) <= 0 ||
        Number(request_item_id) <= 0 ||
        Number(item_id) <= 0
    ) {

        return res.status(400).json({
            message: "Invalid ID"
        });

    }


    // =================================
    // QUANTITY VALIDATION
    // =================================

    const requestedQuantity = Number(quantity);


    if (
        !Number.isFinite(requestedQuantity) ||
        requestedQuantity <= 0
    ) {

        return res.status(400).json({
            message: "Quantity must be greater than zero"
        });

    }


    // =================================
    // START TRANSACTION
    // =================================

    db.beginTransaction((err) => {

        if (err) {

            console.error("Transaction start error:", err);

            return res.status(500).json({
                message: "Transaction start failed"
            });

        }


        // =================================
        // CHECK DISTRIBUTION
        // =================================

        const distributionSql = `

            SELECT
                distribution_id,
                request_id,
                status

            FROM distributions

            WHERE distribution_id = ?

            FOR UPDATE

        `;


        db.query(

            distributionSql,

            [distribution_id],

            (err, distribution) => {

                if (err) {
                    return rollback(res, err);
                }


                if (distribution.length === 0) {

                    return rollback(res, {
                        message: "Distribution not found"
                    });

                }


                // Only an open/pending distribution can receive items
                if (distribution[0].status !== "PENDING") {

                    return rollback(res, {
                        message:
                        "Distribution is already completed or closed"
                    });

                }


                checkRequestItem();

            }

        );


        // =================================
        // CHECK REQUEST ITEM
        // =================================

        function checkRequestItem() {

            const requestSql = `

                SELECT

                    rr.request_id,
                    rr.status,

                    rri.request_item_id,
                    rri.item_id,
                    rri.requested_qty,
                    rri.fulfilled_qty

                FROM relief_request_items rri

                JOIN relief_requests rr
                    ON rri.request_id = rr.request_id

                WHERE rri.request_item_id = ?

                FOR UPDATE

            `;


            db.query(

                requestSql,

                [request_item_id],

                (err, result) => {

                    if (err) {
                        return rollback(res, err);
                    }


                    if (result.length === 0) {

                        return rollback(res, {
                            message: "Request item not found"
                        });

                    }


                    const requestData = result[0];


                    // =================================
                    // REQUEST STATUS VALIDATION
                    // =================================

                    if (
                        requestData.status !== "APPROVED" &&
                        requestData.status !== "PARTIALLY_DELIVERED"
                    ) {

                        return rollback(res, {
                            message:
                            "Request is not ready for distribution"
                        });

                    }


                    // =================================
                    // ITEM MATCH VALIDATION
                    // =================================

                    if (
                        Number(requestData.item_id) !==
                        Number(item_id)
                    ) {

                        return rollback(res, {
                            message: "Item mismatch"
                        });

                    }


                    // =================================
                    // REQUEST QUANTITY VALIDATION
                    // =================================

                    const fulfilledQty =
                        Number(requestData.fulfilled_qty);

                    const requestedQty =
                        Number(requestData.requested_qty);


                    if (
                        fulfilledQty +
                        requestedQuantity >
                        requestedQty
                    ) {

                        return rollback(res, {
                            message:
                            "Cannot exceed requested quantity"
                        });

                    }


                    // =================================
                    // CHECK DUPLICATE
                    // =================================

                    checkDuplicate(requestData);

                }

            );

        }


        // =================================
        // CHECK DUPLICATE DISTRIBUTION ITEM
        // =================================

        function checkDuplicate(requestData) {

            const duplicateSql = `

                SELECT distribution_item_id

                FROM distribution_items

                WHERE distribution_id = ?

                AND request_item_id = ?

            `;


            db.query(

                duplicateSql,

                [
                    distribution_id,
                    request_item_id
                ],

                (err, result) => {

                    if (err) {
                        return rollback(res, err);
                    }


                    if (result.length > 0) {

                        return rollback(res, {
                            message:
                            "Item already distributed"
                        });

                    }


                    updateInventory(requestData);

                }

            );

        }


        // =================================
        // CHECK + LOCK INVENTORY
        // =================================

        function updateInventory(requestData) {

            const inventorySql = `

                SELECT

                    inventory_id,
                    quantity

                FROM shelter_inventory

                WHERE shelter_id =
                (
                    SELECT shelter_id

                    FROM relief_requests

                    WHERE request_id = ?

                )

                AND item_id = ?

                FOR UPDATE

            `;


            db.query(

                inventorySql,

                [
                    requestData.request_id,
                    item_id
                ],

                (err, result) => {

                    if (err) {
                        return rollback(res, err);
                    }


                    if (result.length === 0) {

                        return rollback(res, {
                            message:
                            "Inventory not found"
                        });

                    }


                    const inventory = result[0];


                    const currentStock =
                        Number(inventory.quantity);


                    // =================================
                    // STOCK VALIDATION
                    // =================================

                    if (
                        currentStock <
                        requestedQuantity
                    ) {

                        return rollback(res, {
                            message:
                            "Insufficient inventory"
                        });

                    }


                    const newBalance =
                        currentStock -
                        requestedQuantity;


                    // =================================
                    // UPDATE INVENTORY
                    // =================================

                    db.query(

                        `
                        UPDATE shelter_inventory

                        SET quantity = ?

                        WHERE inventory_id = ?
                        `,

                        [
                            newBalance,
                            inventory.inventory_id
                        ],

                        (err) => {

                            if (err) {
                                return rollback(res, err);
                            }


                            createTransaction(
                                inventory.inventory_id,
                                newBalance,
                                requestData
                            );

                        }

                    );

                }

            );

        }


        // =================================
        // CREATE INVENTORY TRANSACTION
        // =================================

        function createTransaction(
            inventory_id,
            newBalance,
            requestData
        ) {

            const sql = `

                INSERT INTO inventory_transactions

                (
                    inventory_id,
                    txn_type,
                    quantity,
                    balance_after,
                    reference_type,
                    reference_id,
                    notes,
                    created_by
                )

                VALUES (?, ?, ?, ?, ?, ?, ?, ?)

            `;


            db.query(

                sql,

                [
                    inventory_id,
                    "OUT",
                    requestedQuantity,
                    newBalance,
                    "DISTRIBUTION",
                    distribution_id,
                    "Relief distribution",
                    created_by
                ],

                (err) => {

                    if (err) {
                        return rollback(res, err);
                    }


                    insertDistributionItem(requestData);

                }

            );

        }


        // =================================
        // INSERT DISTRIBUTION ITEM
        // =================================

        function insertDistributionItem(requestData) {

            const sql = `

                INSERT INTO distribution_items

                (
                    distribution_id,
                    request_item_id,
                    item_id,
                    quantity
                )

                VALUES (?, ?, ?, ?)

            `;


            db.query(

                sql,

                [
                    distribution_id,
                    request_item_id,
                    item_id,
                    requestedQuantity
                ],

                (err) => {

                    if (err) {
                        return rollback(res, err);
                    }


                    updateFulfilled(requestData);

                }

            );

        }


        // =================================
        // UPDATE FULFILLED QUANTITY
        // =================================

        function updateFulfilled(requestData) {

            db.query(

                `
                UPDATE relief_request_items

                SET fulfilled_qty =
                    fulfilled_qty + ?

                WHERE request_item_id = ?
                `,

                [
                    requestedQuantity,
                    request_item_id
                ],

                (err) => {

                    if (err) {
                        return rollback(res, err);
                    }


                    updateStatus(requestData);

                }

            );

        }


        // =================================
        // UPDATE REQUEST STATUS
        // =================================

        function updateStatus(requestData) {

            const sql = `

                SELECT

                    COALESCE(
                        SUM(requested_qty),
                        0
                    ) AS total_requested,

                    COALESCE(
                        SUM(fulfilled_qty),
                        0
                    ) AS total_fulfilled

                FROM relief_request_items

                WHERE request_id = ?

            `;


            db.query(

                sql,

                [
                    requestData.request_id
                ],

                (err, result) => {

                    if (err) {
                        return rollback(res, err);
                    }


                    const totalRequested =
                        Number(
                            result[0].total_requested
                        );


                    const totalFulfilled =
                        Number(
                            result[0].total_fulfilled
                        );


                    let status =
                        "PARTIALLY_DELIVERED";


                    if (
                        totalFulfilled >=
                        totalRequested
                    ) {

                        status = "DELIVERED";

                    }


                    // =================================
                    // UPDATE RELIEF REQUEST
                    // =================================

                    db.query(

                        `
                        UPDATE relief_requests

                        SET status = ?

                        WHERE request_id = ?

                        `,

                        [
                            status,
                            requestData.request_id
                        ],

                        (err) => {

                            if (err) {
                                return rollback(res, err);
                            }


                            // =================================
                            // COMPLETE DISTRIBUTION
                            //
                            // Only when the whole request
                            // has been delivered.
                            // =================================

                            if (status === "DELIVERED") {

                                db.query(

                                    `
                                    UPDATE distributions

                                    SET status = 'COMPLETED'

                                    WHERE distribution_id = ?

                                    `,

                                    [distribution_id],

                                    (err) => {

                                        if (err) {
                                            return rollback(
                                                res,
                                                err
                                            );
                                        }


                                        commitSuccess(status);

                                    }

                                );

                            } else {

                                // Keep distribution PENDING
                                // so remaining request items
                                // can be added to it.

                                commitSuccess(status);

                            }

                        }

                    );

                }

            );

        }


        // =================================
        // COMMIT SUCCESS
        // =================================

        function commitSuccess(status) {

            db.commit((err) => {

                if (err) {
                    return rollback(res, err);
                }


                res.status(201).json({

                    message:
                    "Distribution item added successfully",

                    distribution_id:
                    Number(distribution_id),

                    request_item_id:
                    Number(request_item_id),

                    item_id:
                    Number(item_id),

                    quantity:
                    requestedQuantity,

                    request_status:
                    status,

                    distribution_status:
                    status === "DELIVERED"
                        ? "COMPLETED"
                        : "PENDING"

                });

            });

        }

    });

};


// =================================
// ROLLBACK
// =================================

const rollback = (res, error) => {

    console.error(
        "Distribution transaction error:",
        error
    );


    db.rollback(() => {

        // MySQL/database error
        // should not be exposed to frontend

        if (error && error.code) {

            return res.status(500).json({

                message:
                "Distribution operation failed"

            });

        }


        // Business validation error

        res.status(400).json({

            message:
            error?.message ||
            "Operation failed"

        });

    });

};


// =================================
// EXPORT
// =================================

module.exports = {

    addDistributionItem

};