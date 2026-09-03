USE reliefsync;


-- ============================================
-- 1. DISASTERS
-- ============================================

CREATE TABLE disasters (

    disaster_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    disaster_code VARCHAR(20) NOT NULL UNIQUE,

    disaster_name VARCHAR(120) NOT NULL,

    disaster_type ENUM(
        'FLOOD',
        'CYCLONE',
        'EARTHQUAKE',
        'LANDSLIDE',
        'DROUGHT',
        'OTHER'
    ) NOT NULL,

    severity ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ) NOT NULL DEFAULT 'MEDIUM',

    start_date DATE NOT NULL,

    end_date DATE NULL,

    status ENUM(
        'ACTIVE',
        'ENDED'
    ) DEFAULT 'ACTIVE',

    description VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ============================================
-- 2. DISASTER AREAS
-- ============================================

CREATE TABLE disaster_areas (

    area_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    disaster_id INT UNSIGNED NOT NULL,

    district VARCHAR(80) NOT NULL,

    upazila VARCHAR(80),

    union_name VARCHAR(80),

    affected_population INT UNSIGNED,

    damage_level ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'SEVERE'
    ),

    CONSTRAINT fk_area_disaster
        FOREIGN KEY(disaster_id)
        REFERENCES disasters(disaster_id)
        ON DELETE CASCADE

);



-- ============================================
-- 3. CONNECT SHELTER WITH DISASTER
-- ============================================

ALTER TABLE shelters

ADD COLUMN disaster_id INT UNSIGNED NULL,


ADD CONSTRAINT fk_shelter_disaster

FOREIGN KEY(disaster_id)

REFERENCES disasters(disaster_id);