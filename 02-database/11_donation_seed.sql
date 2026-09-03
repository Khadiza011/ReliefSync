USE reliefsync;

INSERT IGNORE INTO donors
(
    donor_code,
    donor_name,
    donor_type,
    phone,
    email
)
VALUES
(
    'DON-001',
    'Helping Hands Foundation',
    'ORGANIZATION',
    '01711111111',
    'contact@helpinghands.org'
);