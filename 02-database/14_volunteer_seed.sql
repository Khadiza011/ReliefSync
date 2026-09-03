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