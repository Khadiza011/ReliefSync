const db = require("../config/db");


// =================================
// CHECK SHELTER ACCESS
// =================================

const checkShelterAccess = (req, shelter_id) => {
    return new Promise((resolve, reject) => {
        const user_id = req.user.user_id;
        const role_id = req.user.role_id;

        // ADMIN + RELIEF_MANAGER
        if (role_id === 1 || role_id === 3) {
            return resolve(true);
        }

        // SHELTER_MANAGER
        if (role_id === 2) {
            const sql = `
                SELECT shelter_id
                FROM shelter_managers
                WHERE user_id = ?
                AND shelter_id = ?
            `;
            return db.query(sql, [user_id, shelter_id])
                .then(([result]) => {
                    resolve(result.length > 0);
                })
                .catch(() => resolve(false));
        }

        resolve(false);
    });
};


// =================================
// GET INVENTORY LIST
// =================================

const getInventory = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const role_id = req.user.role_id;
        
        let sql = `
        SELECT
            si.inventory_id,
            si.shelter_id,
            s.shelter_name,
            si.item_id,
            i.item_name,
            i.unit,
            ic.category_name,
            si.quantity,
            si.reorder_level,
            si.updated_at,
            CASE
                WHEN ? = 4 THEN EXISTS (
                    SELECT 1
                    FROM inventory_stock_reports isr
                    JOIN volunteers rv ON rv.volunteer_id = isr.volunteer_id
                    WHERE isr.inventory_id = si.inventory_id
                      AND isr.status = 'OPEN'
                      AND rv.user_id = ?
                )
                ELSE 0
            END AS has_open_report
        FROM shelter_inventory si
        JOIN shelters s
        ON si.shelter_id = s.shelter_id
        JOIN items i
        ON si.item_id = i.item_id
        LEFT JOIN item_categories ic
        ON i.category_id = ic.category_id
        `;
        
        let values = [role_id, user_id];
        
        if (role_id === 2) {
            sql += `
            WHERE si.shelter_id IN
            (
                SELECT shelter_id
                FROM shelter_managers
                WHERE user_id = ?
            )
            `;
            values.push(user_id);
        } else if (role_id === 4) {
            sql += `
            WHERE si.shelter_id IN
            (
                SELECT shelter_id
                FROM assignments a
                JOIN volunteers v
                ON a.volunteer_id = v.volunteer_id
                WHERE v.user_id = ?
                AND a.status = 'ACTIVE'
            )
            `;
            values.push(user_id);
        }
        
        const [result] = await db.query(sql, values);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error" });
    }
};


// =================================
// REDUCE INVENTORY WITH TRANSACTION
// =================================

const reduceInventory = async (req, res) => {
    try {
        const { shelter_id, item_id, quantity } = req.body;
        
        if (!quantity || isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({ message: "Quantity must be greater than zero" });
        }
        
        const allowed = await checkShelterAccess(req, shelter_id);
        if (!allowed) {
            return res.status(403).json({ message: "You cannot access this shelter inventory" });
        }
        
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            const updateSql = `
                UPDATE shelter_inventory
                SET quantity = quantity - ?
                WHERE shelter_id = ?
                AND item_id = ?
                AND quantity >= ?
            `;
            const [updateResult] = await connection.query(updateSql, [quantity, shelter_id, item_id, quantity]);
            
            if (updateResult.affectedRows === 0) {
                throw new Error("Insufficient stock or item not found");
            }
            
            const balanceSql = `
                SELECT inventory_id, quantity
                FROM shelter_inventory
                WHERE shelter_id = ? AND item_id = ?
            `;
            const [stock] = await connection.query(balanceSql, [shelter_id, item_id]);
            
            const txnSql = `
                INSERT INTO inventory_transactions
                (inventory_id, txn_type, quantity, balance_after, reference_type, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            await connection.query(txnSql, [
                stock[0].inventory_id,
                "OUT",
                quantity,
                stock[0].quantity,
                "INVENTORY_REDUCE",
                req.user.user_id
            ]);
            
            await connection.commit();
            res.json({ message: "Inventory reduced successfully" });
            
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
        
    } catch (err) {
        console.error(err);
        if (err.message === "Insufficient stock or item not found") {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// ADD INVENTORY WITH TRANSACTION
// =================================

const addInventory = async (req, res) => {
    try {
        const { shelter_id, item_id, quantity } = req.body;
        
        if (!quantity || isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({ message: "Quantity must be greater than zero" });
        }
        
        const allowed = await checkShelterAccess(req, shelter_id);
        if (!allowed) {
            return res.status(403).json({ message: "You cannot access this shelter inventory" });
        }
        
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            const checkSql = `SELECT * FROM shelter_inventory WHERE shelter_id = ? AND item_id = ?`;
            const [existing] = await connection.query(checkSql, [shelter_id, item_id]);
            
            let inventoryId;
            
            if (existing.length > 0) {
                // Existing item
                const updateSql = `UPDATE shelter_inventory SET quantity = quantity + ? WHERE shelter_id = ? AND item_id = ?`;
                await connection.query(updateSql, [quantity, shelter_id, item_id]);
                inventoryId = existing[0].inventory_id;
            } else {
                // New item
                const insertSql = `INSERT INTO shelter_inventory (shelter_id, item_id, quantity) VALUES (?, ?, ?)`;
                const [result] = await connection.query(insertSql, [shelter_id, item_id, quantity]);
                inventoryId = result.insertId;
            }
            
            // Get balance after
            const [stock] = await connection.query(
                `SELECT inventory_id, quantity FROM shelter_inventory WHERE inventory_id = ?`,
                [inventoryId]
            );
            
            // Save transaction
            const txnSql = `
                INSERT INTO inventory_transactions
                (inventory_id, txn_type, quantity, balance_after, reference_type, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            await connection.query(txnSql, [
                stock[0].inventory_id,
                "IN",
                quantity,
                stock[0].quantity,
                "INVENTORY_ADD",
                req.user.user_id
            ]);
            
            await connection.commit();
            res.json({ message: "Inventory updated successfully" });
            
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error", error: err.message });
    }
};




// =================================
// ADD BRAND NEW ITEM + INITIAL STOCK
// =================================

const addNewInventoryItem = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { shelter_id, item_name, reorder_level, quantity } = req.body;

        const cleanName = String(item_name || "").trim();
        const qty = Number(quantity);
        const reorder = Number(reorder_level);

        if (!shelter_id || !cleanName) {
            return res.status(400).json({ message: "Shelter and item name are required" });
        }

        if (!Number.isFinite(qty) || qty <= 0) {
            return res.status(400).json({ message: "Quantity must be greater than zero" });
        }

        if (!Number.isFinite(reorder) || reorder < 0) {
            return res.status(400).json({ message: "Reorder point must be zero or greater" });
        }

        const allowed = await checkShelterAccess(req, shelter_id);
        if (!allowed) {
            return res.status(403).json({ message: "You cannot access this shelter inventory" });
        }

        await connection.beginTransaction();

        const [existingItem] = await connection.query(
            `SELECT item_id FROM items WHERE LOWER(item_name) = LOWER(?) LIMIT 1`,
            [cleanName]
        );

        if (existingItem.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                message: "This item already exists. Select it from the existing item list instead."
            });
        }

        // The current schema requires category + unit, while the UI requirement only
        // asks for item name, reorder point and quantity. Use the generic
        // 'Shelter Item' category (or the first available category) and 'Unit'.
        const [categories] = await connection.query(`
            SELECT category_id
            FROM item_categories
            ORDER BY CASE WHEN category_name = 'Shelter Item' THEN 0 ELSE 1 END, category_id
            LIMIT 1
        `);

        if (categories.length === 0) {
            throw new Error("No item category is available");
        }

        const itemCode = `ITEM-${Date.now()}`.slice(0, 20);

        const [itemResult] = await connection.query(
            `INSERT INTO items (category_id, item_code, item_name, unit, is_active)
             VALUES (?, ?, ?, 'Unit', 1)`,
            [categories[0].category_id, itemCode, cleanName]
        );

        const [inventoryResult] = await connection.query(
            `INSERT INTO shelter_inventory
             (shelter_id, item_id, quantity, reorder_level)
             VALUES (?, ?, ?, ?)`,
            [shelter_id, itemResult.insertId, qty, reorder]
        );

        await connection.query(
            `INSERT INTO inventory_transactions
             (inventory_id, txn_type, quantity, balance_after, reference_type, created_by)
             VALUES (?, 'IN', ?, ?, 'INVENTORY_ADD', ?)`,
            [inventoryResult.insertId, qty, qty, req.user.user_id]
        );

        await connection.commit();

        return res.status(201).json({
            message: "New item created and added to inventory successfully",
            item_id: itemResult.insertId,
            inventory_id: inventoryResult.insertId
        });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    } finally {
        connection.release();
    }
};


// =================================
// GET LOW STOCK ITEMS
// =================================

const getLowStock = async (req, res) => {
    try {
        const sql = `
            SELECT
                si.inventory_id,
                si.shelter_id,
                s.shelter_name,
                i.item_name,
                ic.category_name,
                si.quantity,
                si.reorder_level,
                'LOW_STOCK' AS status
            FROM shelter_inventory si
            JOIN shelters s ON si.shelter_id = s.shelter_id
            JOIN items i ON si.item_id = i.item_id
            LEFT JOIN item_categories ic ON i.category_id = ic.category_id
            WHERE si.quantity <= si.reorder_level
            ${req.user.role_id === 2 ? "AND si.shelter_id IN (SELECT sm.shelter_id FROM shelter_managers sm WHERE sm.user_id = ?)" : ""}
        `;
        const [result] = await db.query(sql, req.user.role_id === 2 ? [req.user.user_id] : []);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// VOLUNTEER: REPORT LOW / EMPTY STOCK TO SHELTER MANAGER
// =================================
const reportLowStock = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const inventory_id = Number(req.params.inventoryId);
        const note = String(req.body?.note || '').trim().slice(0, 255) || null;

        if (!inventory_id) {
            return res.status(400).json({ message: "Valid inventory id is required" });
        }

        const [profiles] = await db.query(
            `SELECT volunteer_id FROM volunteers WHERE user_id = ? LIMIT 1`,
            [user_id]
        );

        if (!profiles.length) {
            return res.status(404).json({ message: "Volunteer profile not found" });
        }

        const volunteer_id = profiles[0].volunteer_id;

        const [rows] = await db.query(
            `SELECT
                si.inventory_id,
                si.shelter_id,
                si.item_id,
                si.quantity,
                si.reorder_level,
                i.item_name,
                s.shelter_name
             FROM shelter_inventory si
             JOIN items i ON i.item_id = si.item_id
             JOIN shelters s ON s.shelter_id = si.shelter_id
             WHERE si.inventory_id = ?
               AND si.shelter_id IN (
                   SELECT a.shelter_id
                   FROM assignments a
                   WHERE a.volunteer_id = ?
                     AND a.status = 'ACTIVE'
               )
             LIMIT 1`,
            [inventory_id, volunteer_id]
        );

        if (!rows.length) {
            return res.status(403).json({ message: "You can only report stock for your active assigned shelter" });
        }

        const stock = rows[0];
        if (Number(stock.quantity) > Number(stock.reorder_level)) {
            return res.status(400).json({ message: "This item is not low or out of stock" });
        }

        const [existing] = await db.query(
            `SELECT report_id
             FROM inventory_stock_reports
             WHERE inventory_id = ? AND volunteer_id = ? AND status = 'OPEN'
             LIMIT 1`,
            [inventory_id, volunteer_id]
        );

        if (existing.length) {
            return res.status(409).json({ message: "You already reported this stock item. The shelter manager has not acknowledged it yet." });
        }

        const [result] = await db.query(
            `INSERT INTO inventory_stock_reports
             (inventory_id, shelter_id, item_id, volunteer_id, quantity_at_report, reorder_level_at_report, note)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                stock.inventory_id,
                stock.shelter_id,
                stock.item_id,
                volunteer_id,
                stock.quantity,
                stock.reorder_level,
                note
            ]
        );

        return res.status(201).json({
            message: `${stock.item_name} stock report sent to the shelter manager`,
            report_id: result.insertId
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// SHELTER MANAGER: VIEW VOLUNTEER STOCK REPORTS
// =================================
const getMyStockReports = async (req, res) => {
    try {
        const [reports] = await db.query(
            `SELECT
                r.report_id,
                r.inventory_id,
                r.shelter_id,
                s.shelter_name,
                r.item_id,
                i.item_name,
                i.unit,
                r.quantity_at_report,
                r.reorder_level_at_report,
                r.note,
                r.status,
                r.reported_at,
                r.acknowledged_at,
                v.volunteer_id,
                v.volunteer_name,
                u.full_name AS acknowledged_by_name
             FROM inventory_stock_reports r
             JOIN shelters s ON s.shelter_id = r.shelter_id
             JOIN items i ON i.item_id = r.item_id
             JOIN volunteers v ON v.volunteer_id = r.volunteer_id
             LEFT JOIN users u ON u.user_id = r.acknowledged_by
             WHERE r.shelter_id IN (
                 SELECT sm.shelter_id
                 FROM shelter_managers sm
                 WHERE sm.user_id = ?
             )
             ORDER BY (r.status = 'OPEN') DESC, r.reported_at DESC`,
            [req.user.user_id]
        );

        return res.json(reports);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


// =================================
// SHELTER MANAGER: ACKNOWLEDGE A STOCK REPORT
// =================================
const acknowledgeStockReport = async (req, res) => {
    try {
        const report_id = Number(req.params.reportId);

        if (!report_id) {
            return res.status(400).json({ message: "Valid report id is required" });
        }

        const [result] = await db.query(
            `UPDATE inventory_stock_reports r
             SET r.status = 'ACKNOWLEDGED',
                 r.acknowledged_at = CURRENT_TIMESTAMP,
                 r.acknowledged_by = ?
             WHERE r.report_id = ?
               AND r.status = 'OPEN'
               AND r.shelter_id IN (
                   SELECT sm.shelter_id
                   FROM shelter_managers sm
                   WHERE sm.user_id = ?
               )`,
            [req.user.user_id, report_id, req.user.user_id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({ message: "Open stock report not found for your shelter" });
        }

        return res.json({ message: "Stock report acknowledged" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err.message });
    }
};


module.exports = {
    getInventory,
    reduceInventory,
    addInventory,
    addNewInventoryItem,
    getLowStock,
    reportLowStock,
    getMyStockReports,
    acknowledgeStockReport
};