CREATE TABLE shelter_waitlist
(

    waitlist_id BIGINT AUTO_INCREMENT PRIMARY KEY,


    family_id BIGINT NOT NULL,


    priority ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    )
    DEFAULT 'MEDIUM',


    preferred_area VARCHAR(100),


    status ENUM(
        'WAITING',
        'ALLOCATED',
        'CANCELLED'
    )
    DEFAULT 'WAITING',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_waitlist_family

    FOREIGN KEY(family_id)

    REFERENCES families(family_id)

);