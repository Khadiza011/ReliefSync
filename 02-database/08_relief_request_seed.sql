USE reliefsync;

INSERT INTO relief_requests
(
    request_code,
    shelter_id,
    priority,
    status,
    notes
)

VALUES
(
    'REQ-001',

    (
        SELECT shelter_id
        FROM shelters
        WHERE shelter_code = 'SH-001'
    ),

    'CRITICAL',
    'APPROVED',
    'Emergency rice requirement'
);


INSERT INTO relief_request_items
(
    request_id,
    item_id,
    requested_qty
)

VALUES
(
    (
        SELECT request_id
        FROM relief_requests
        WHERE request_code = 'REQ-001'
    ),

    (
        SELECT item_id
        FROM items
        WHERE item_code = 'ITEM-001'
    ),

    50
);