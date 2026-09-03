USE reliefsync;


INSERT INTO disasters
(
    disaster_code,
    disaster_name,
    disaster_type,
    severity,
    start_date,
    description
)

VALUES

(
    'DIS-001',
    'Feni Flood 2026',
    'FLOOD',
    'CRITICAL',
    '2026-08-20',
    'Severe flood affecting coastal and river areas'
);



INSERT INTO disaster_areas
(
    disaster_id,
    district,
    upazila,
    union_name,
    affected_population,
    damage_level
)

VALUES

(
    (
        SELECT disaster_id
        FROM disasters
        WHERE disaster_code='DIS-001'
    ),

    'Feni',
    'Sonagazi',
    'Char Majlishpur',
    50000,
    'SEVERE'
);