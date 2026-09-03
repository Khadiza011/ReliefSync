USE reliefsync;

-- =========================================
-- SAMPLE SHELTER
-- =========================================

INSERT INTO shelters
(
    shelter_code,
    shelter_name,
    shelter_type,
    district,
    upazila,
    address,
    total_capacity,
    operational_status,
    contact_person,
    contact_phone
)
VALUES
(
    'SH-001',
    'Feni Central Shelter',
    'COLLECTIVE',
    'Feni',
    'Feni Sadar',
    'Feni Government School',
    10,
    'OPEN',
    'Rahim Ahmed',
    '01700000001'
);


-- =========================================
-- SAMPLE FAMILY
-- =========================================

INSERT INTO families
(
    family_code,
    contact_phone,
    current_district,
    current_area,
    priority,
    status
)
VALUES
(
    'FAM-001',
    '01800000001',
    'Feni',
    'Sonagazi',
    'HIGH',
    'NEEDS_SHELTER'
);


-- =========================================
-- FAMILY MEMBERS
-- =========================================

INSERT INTO family_members
(
    family_id,
    full_name,
    age_years,
    sex,
    is_head,
    relationship_to_head
)
VALUES
(
    (SELECT family_id
     FROM families
     WHERE family_code = 'FAM-001'),

    'Karim Uddin',
    42,
    'MALE',
    TRUE,
    'HEAD'
);


INSERT INTO family_members
(
    family_id,
    full_name,
    age_years,
    sex,
    is_head,
    relationship_to_head
)
VALUES
(
    (SELECT family_id
     FROM families
     WHERE family_code = 'FAM-001'),

    'Salma Begum',
    37,
    'FEMALE',
    FALSE,
    'SPOUSE'
);


INSERT INTO family_members
(
    family_id,
    full_name,
    age_years,
    sex,
    is_head,
    relationship_to_head
)
VALUES
(
    (SELECT family_id
     FROM families
     WHERE family_code = 'FAM-001'),

    'Rafi Uddin',
    12,
    'MALE',
    FALSE,
    'CHILD'
);