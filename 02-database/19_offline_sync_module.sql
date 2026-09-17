CREATE TABLE offline_sync_queue (

    sync_id INT AUTO_INCREMENT PRIMARY KEY,

    device_id VARCHAR(100) NOT NULL,

    data_type VARCHAR(50) NOT NULL,

    record_data JSON NOT NULL,

    sync_status ENUM('PENDING','SYNCED') DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    synced_at TIMESTAMP NULL

);

INSERT INTO offline_sync_queue
(
device_id,
data_type,
record_data
)
VALUES
(
'DEVICE-001',
'FAMILY',
'{"name":"Rahim","members":5,"location":"Feni"}'
);