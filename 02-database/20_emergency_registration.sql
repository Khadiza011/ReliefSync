CREATE TABLE emergency_registrations (

    emergency_id INT AUTO_INCREMENT PRIMARY KEY,

    family_name VARCHAR(100) NOT NULL,

    member_count INT NOT NULL,

    phone VARCHAR(20),

    location VARCHAR(150),

    priority ENUM('LOW','MEDIUM','HIGH','CRITICAL')
    DEFAULT 'MEDIUM',

    registration_status ENUM('PENDING','VERIFIED')
    DEFAULT 'PENDING',

    sync_status ENUM('LOCAL','SYNCED')
    DEFAULT 'LOCAL',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);