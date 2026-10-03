const jwt = require("jsonwebtoken");
const db = require("../config/db");


// =================================
// VERIFY JWT TOKEN
// Also confirms the account is still ACTIVE, so an administrator
// who deactivates a user cuts off their existing sessions at once.
// =================================

const verifyToken = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Authorization token required" });
    }

    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Invalid token format" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Token missing" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {

        if (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }

        try {
            const [rows] = await db.query(
                "SELECT status FROM users WHERE user_id = ? LIMIT 1",
                [decoded.user_id]
            );

            if (rows.length === 0 || rows[0].status !== "ACTIVE") {
                return res.status(403).json({ message: "Invalid or expired token: this account is not active" });
            }
        } catch (dbErr) {
            console.error("Auth status check failed:", dbErr.message);
            return res.status(500).json({ message: "Could not verify account" });
        }

        req.user = decoded;
        next();
    });
};


module.exports = {
    verifyToken
};
