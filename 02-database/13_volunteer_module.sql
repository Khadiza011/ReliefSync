USE reliefsync;

-- ============================================
-- 1. VOLUNTEERS
-- ============================================

CREATE TABLE IF NOT EXISTS volunteers (
    volunteer_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NULL,

    volunteer_code VARCHAR(20) NOT NULL UNIQUE,
    volunteer_name VARCHAR(120) NOT NULL,

    phone VARCHAR(20),
    email VARCHAR(150),

    availability ENUM(
        'AVAILABLE',
        'BUSY',
        'INACTIVE'
    ) NOT NULL DEFAULT 'AVAILABLE',

    created_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_volunteer_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- ============================================
-- 2. SKILLS
-- ============================================

CREATE TABLE IF NOT EXISTS skills (
    skill_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    skill_name VARCHAR(100) NOT NULL UNIQUE,

    description VARCHAR(255)
);


-- ============================================
-- 3. VOLUNTEER SKILLS
-- Many-to-Many relationship
-- ============================================

CREATE TABLE IF NOT EXISTS volunteer_skills (
    volunteer_id BIGINT UNSIGNED NOT NULL,

    skill_id SMALLINT UNSIGNED NOT NULL,

    PRIMARY KEY (volunteer_id, skill_id),

    CONSTRAINT fk_vs_volunteer
        FOREIGN KEY (volunteer_id)
        REFERENCES volunteers(volunteer_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_vs_skill
        FOREIGN KEY (skill_id)
        REFERENCES skills(skill_id)
        ON DELETE CASCADE
);


-- ============================================
-- 4. ASSIGNMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS assignments (
    assignment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    volunteer_id BIGINT UNSIGNED NOT NULL,

    shelter_id INT UNSIGNED NOT NULL,

    skill_id SMALLINT UNSIGNED NULL,

    task_title VARCHAR(150) NOT NULL,

    task_description VARCHAR(255),

    status ENUM(
        'ACTIVE',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'ACTIVE',

    assigned_by BIGINT UNSIGNED NULL,

    assigned_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    completed_at TIMESTAMP NULL,

    CONSTRAINT fk_assignment_volunteer
        FOREIGN KEY (volunteer_id)
        REFERENCES volunteers(volunteer_id),

    CONSTRAINT fk_assignment_shelter
        FOREIGN KEY (shelter_id)
        REFERENCES shelters(shelter_id),

    CONSTRAINT fk_assignment_skill
        FOREIGN KEY (skill_id)
        REFERENCES skills(skill_id),

    CONSTRAINT fk_assignment_user
        FOREIGN KEY (assigned_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

ALTER TABLE volunteer_skills
ADD CONSTRAINT unique_volunteer_skill
UNIQUE(volunteer_id, skill_id);