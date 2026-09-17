USE reliefsync;



-- =====================================================
-- 1. MEDICAL TEAMS
-- Stores doctors, nurses and medical volunteers
-- =====================================================

CREATE TABLE medical_teams (

    medical_team_id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    role ENUM(
        'DOCTOR',
        'NURSE',
        'MEDICAL_VOLUNTEER'
    ) NOT NULL,

    phone VARCHAR(20),

    location VARCHAR(100),

    availability ENUM(
        'AVAILABLE',
        'BUSY',
        'OFFLINE'
    ) DEFAULT 'AVAILABLE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE medical_requests (

    medical_request_id INT AUTO_INCREMENT PRIMARY KEY,

    family_id INT NOT NULL,

    problem_description TEXT NOT NULL,

    priority ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'EMERGENCY'
    ) DEFAULT 'MEDIUM',

    status ENUM(
        'PENDING',
        'ASSIGNED',
        'COMPLETED'
    ) DEFAULT 'PENDING',

    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE medical_assignments (

    assignment_id INT AUTO_INCREMENT PRIMARY KEY,

    medical_request_id INT NOT NULL,

    medical_team_id INT NOT NULL,

    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'ASSIGNED',
        'COMPLETED'
    ) DEFAULT 'ASSIGNED'

);

-- Fix datatype with families.family_id
ALTER TABLE medical_requests
MODIFY family_id BIGINT(20) UNSIGNED NOT NULL;

ALTER TABLE medical_requests
ADD CONSTRAINT fk_medical_request_family
FOREIGN KEY (family_id)
REFERENCES families(family_id)
ON UPDATE CASCADE
ON DELETE CASCADE;

ALTER TABLE medical_assignments
ADD CONSTRAINT fk_assignment_request
FOREIGN KEY (medical_request_id)
REFERENCES medical_requests(medical_request_id)
ON UPDATE CASCADE
ON DELETE CASCADE;

ALTER TABLE medical_assignments
ADD CONSTRAINT fk_assignment_team
FOREIGN KEY (medical_team_id)
REFERENCES medical_teams(medical_team_id)
ON UPDATE CASCADE
ON DELETE CASCADE;

ALTER TABLE medical_assignments
ADD COLUMN volunteer_id BIGINT(20) UNSIGNED NULL
AFTER medical_team_id;

ALTER TABLE medical_assignments
ADD CONSTRAINT fk_medical_assignment_volunteer
FOREIGN KEY (volunteer_id)
REFERENCES volunteers(volunteer_id)
ON UPDATE CASCADE
ON DELETE SET NULL;

ALTER TABLE medical_assignments
MODIFY medical_team_id INT NULL;