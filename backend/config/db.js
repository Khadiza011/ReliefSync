const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'reliefsync',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection
pool.getConnection()
    .then(conn => {
        console.log("Database connected successfully (pool)");
        conn.release();
    })
    .catch(err => {
        console.log("Database connection failed:", err.message);
    });

module.exports = pool;