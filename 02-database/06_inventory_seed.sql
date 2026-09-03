USE reliefsync;

-- ============================================
-- ITEM CATEGORIES
-- ============================================

INSERT IGNORE INTO item_categories (category_name)
VALUES
('Food'),
('Water'),
('Medicine'),
('Hygiene'),
('Shelter Item');


-- ============================================
-- ITEMS
-- ============================================

INSERT IGNORE INTO items
(
    category_id,
    item_code,
    item_name,
    unit
)
VALUES
(
    (SELECT category_id
     FROM item_categories
     WHERE category_name = 'Food'),

    'ITEM-001',
    'Rice',
    'KG'
),

(
    (SELECT category_id
     FROM item_categories
     WHERE category_name = 'Water'),

    'ITEM-002',
    'Drinking Water',
    'Bottle'
),

(
    (SELECT category_id
     FROM item_categories
     WHERE category_name = 'Medicine'),

    'ITEM-003',
    'Oral Saline',
    'Pack'
),

(
    (SELECT category_id
     FROM item_categories
     WHERE category_name = 'Shelter Item'),

    'ITEM-004',
    'Blanket',
    'Piece'
);


-- ============================================
-- INITIALIZE SH-001 INVENTORY
-- Stock starts from zero
-- ============================================

INSERT INTO shelter_inventory
(
    shelter_id,
    item_id,
    quantity,
    reorder_level
)

SELECT
    s.shelter_id,
    i.item_id,
    0,

    CASE i.item_code
        WHEN 'ITEM-001' THEN 30
        WHEN 'ITEM-002' THEN 50
        WHEN 'ITEM-003' THEN 20
        WHEN 'ITEM-004' THEN 10
        ELSE 0
    END

FROM shelters s
CROSS JOIN items i

WHERE s.shelter_code = 'SH-001'
AND i.item_code IN (
    'ITEM-001',
    'ITEM-002',
    'ITEM-003',
    'ITEM-004'
)

ON DUPLICATE KEY UPDATE
    reorder_level = VALUES(reorder_level);