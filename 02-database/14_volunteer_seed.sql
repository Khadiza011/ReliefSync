USE reliefsync;

-- ============================================
-- SKILLS
-- ============================================

INSERT IGNORE INTO skills (skill_name)
VALUES
('First Aid'),
('Driving'),
('Shelter Management'),
('Food Distribution'),
('Logistics');

INSERT INTO skills
(
    skill_name,
    description
)

VALUES

(
    'Emergency Medical Support',
    'Ability to provide emergency healthcare support during disasters'
),

(
    'Patient Care',
    'Ability to assist injured and affected people'
),

(
    'Medicine Handling',
    'Ability to manage and distribute basic medicines'
);

UPDATE skills
SET description = 'Ability to provide basic medical assistance and first aid during emergency situations'
WHERE skill_id = 1;


UPDATE skills
SET description = 'Ability to operate vehicles and provide transportation support during disaster response'
WHERE skill_id = 2;


UPDATE skills
SET description = 'Ability to manage shelter activities, organize displaced people and maintain shelter facilities'
WHERE skill_id = 3;


UPDATE skills
SET description = 'Ability to distribute food and relief materials among affected people'
WHERE skill_id = 4;


UPDATE skills
SET description = 'Ability to manage resources, organize supplies and support disaster logistics operations'
WHERE skill_id = 5;
-- ============================================
-- VOLUNTEER
-- ============================================

INSERT IGNORE INTO volunteers
(
    volunteer_code,
    volunteer_name,
    phone,
    email,
    availability
)
VALUES
(
    'VOL-001',
    'Arif Hossain',
    '01900000001',
    'arif@example.com',
    'AVAILABLE'
);


-- ============================================
-- VOLUNTEER SKILLS
-- Arif knows First Aid and Driving
-- ============================================

INSERT IGNORE INTO volunteer_skills
(
    volunteer_id,
    skill_id
)
VALUES
(
    (
        SELECT volunteer_id
        FROM volunteers
        WHERE volunteer_code = 'VOL-001'
    ),

    (
        SELECT skill_id
        FROM skills
        WHERE skill_name = 'First Aid'
    )
),

(
    (
        SELECT volunteer_id
        FROM volunteers
        WHERE volunteer_code = 'VOL-001'
    ),

    (
        SELECT skill_id
        FROM skills
        WHERE skill_name = 'Driving'
    )
);

INSERT INTO volunteer_skills
(
    volunteer_id,
    skill_id
)

VALUES

(
    1,
    7
),

(
    1,
    8
),

(
    1,
    9
);