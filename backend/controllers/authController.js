const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { closeAccount } = require("../utils/accountDeletion");


// =================================
// REGISTER USER
// ONLY VOLUNTEER AND DONOR
// =================================

const register = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { full_name, email, password, phone, role } = req.body;

        if (!full_name || !email || !password || !role) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const allowedRoles = { VOLUNTEER: 4, DONOR: 5 };
        const roleName = String(role).toUpperCase();

        if (!allowedRoles[roleName]) {
            return res.status(400).json({ message: "Only VOLUNTEER and DONOR registration allowed" });
        }

        const role_id = allowedRoles[roleName];
        const normalizedEmail = String(email).toLowerCase().trim();
        const normalizedName = String(full_name).trim();
        const normalizedPhone = phone ? String(phone).trim() : null;

        if (!normalizedName) {
            return res.status(400).json({ message: "Full name is required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        if (String(password).length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const [existing] = await connection.query(
            "SELECT user_id FROM users WHERE email = ? AND deleted_at IS NULL",
            [normalizedEmail]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        await connection.beginTransaction();

        const hash = await bcrypt.hash(password, 10);
        const accountStatus = roleName === "VOLUNTEER" ? "INACTIVE" : "ACTIVE";

        const [result] = await connection.query(
            `INSERT INTO users (role_id, full_name, email, password_hash, phone, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [role_id, normalizedName, normalizedEmail, hash, normalizedPhone, accountStatus]
        );

        const user_id = result.insertId;

        // A self-registered volunteer becomes a pending volunteer immediately.
        // Admin approval later activates both the user account and volunteer profile.
        if (roleName === "VOLUNTEER") {
            const volunteerCode = `VOL-${String(user_id).padStart(4, "0")}`;

            await connection.query(
                `INSERT INTO volunteers
                    (user_id, volunteer_code, volunteer_name, phone, email, availability)
                 VALUES (?, ?, ?, ?, ?, 'INACTIVE')`,
                [user_id, volunteerCode, normalizedName, normalizedPhone, normalizedEmail]
            );
        }

        await connection.commit();

        return res.status(201).json({
            message: roleName === "VOLUNTEER"
                ? "Registration submitted. An administrator must approve your volunteer account before you can sign in."
                : "User registered successfully",
            user_id,
            role: roleName,
            approval_required: roleName === "VOLUNTEER"
        });

    } catch (error) {
        try { await connection.rollback(); } catch (_) { /* no-op */ }
        console.error("Registration error:", error);
        return res.status(500).json({ message: "User registration failed", error: error.message });
    } finally {
        connection.release();
    }
};


// =================================
// LOGIN USER
// =================================

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const [result] = await db.query(
            `SELECT user_id, role_id, full_name, email, password_hash, status 
             FROM users WHERE email = ? AND deleted_at IS NULL`,
            [normalizedEmail]
        );

        if (result.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = result[0];

        if (user.status !== "ACTIVE") {
            return res.status(403).json({
                message: user.role_id === 4
                    ? "Your volunteer account is waiting for administrator approval"
                    : "Account is inactive"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { user_id: user.user_id, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role_id: user.role_id
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed", error: error.message });
    }
};


// =================================
// GET OWN PROFILE
// =================================

const getProfile = async (req, res) => {
    try {
        const [rows] = await db.query(
            `
                SELECT user_id, role_id, full_name, email, phone, status, created_at
                FROM users
                WHERE user_id = ?
                LIMIT 1
            `,
            [req.user.user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({ user: rows[0] });
    } catch (error) {
        console.error("Get profile error:", error);
        return res.status(500).json({ message: "Could not load profile", error: error.message });
    }
};


// =================================
// UPDATE OWN PROFILE
// =================================

const updateProfile = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const user_id = req.user.user_id;
        const { full_name, email, phone } = req.body;
        const name = String(full_name || "").trim();
        const normalizedEmail = String(email || "").toLowerCase().trim();
        const normalizedPhone = phone ? String(phone).trim() : null;

        if (!name || !normalizedEmail) {
            return res.status(400).json({ message: "Name and email are required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const [duplicate] = await connection.query(
            `SELECT user_id FROM users WHERE email = ? AND deleted_at IS NULL AND user_id <> ? LIMIT 1`,
            [normalizedEmail, user_id]
        );

        if (duplicate.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            `
                UPDATE users
                SET full_name = ?, email = ?, phone = ?
                WHERE user_id = ?
            `,
            [name, normalizedEmail, normalizedPhone, user_id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "User not found" });
        }

        // Keep linked volunteer/donor profile data in sync with the account.
        await connection.query(
            `
                UPDATE volunteers
                SET volunteer_name = ?, email = ?, phone = ?
                WHERE user_id = ?
            `,
            [name, normalizedEmail, normalizedPhone, user_id]
        );

        await connection.query(
            `
                UPDATE donors
                SET donor_name = ?, email = ?, phone = ?
                WHERE user_id = ?
            `,
            [name, normalizedEmail, normalizedPhone, user_id]
        );

        await connection.commit();

        const [rows] = await connection.query(
            `SELECT user_id, role_id, full_name, email, phone, status, created_at FROM users WHERE user_id = ?`,
            [user_id]
        );

        return res.json({
            message: "Profile updated successfully",
            user: rows[0]
        });
    } catch (error) {
        try { await connection.rollback(); } catch (_) { /* no-op */ }
        console.error("Update profile error:", error);
        return res.status(500).json({ message: "Could not update profile", error: error.message });
    } finally {
        connection.release();
    }
};


// =================================
// CHANGE OWN PASSWORD
// =================================

const changePassword = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ message: "Current password and new password are required" });
        }

        if (String(new_password).length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        if (current_password === new_password) {
            return res.status(400).json({ message: "New password must be different from the current password" });
        }

        const [rows] = await db.query(
            `SELECT password_hash FROM users WHERE user_id = ? LIMIT 1`,
            [user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const matches = await bcrypt.compare(current_password, rows[0].password_hash);
        if (!matches) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        const password_hash = await bcrypt.hash(new_password, 10);
        await db.query(
            `UPDATE users SET password_hash = ? WHERE user_id = ?`,
            [password_hash, user_id]
        );

        return res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({ message: "Could not change password", error: error.message });
    }
};


// =================================
// DELETE / LEAVE OWN ACCOUNT
// DONOR: immediate closure. Other roles: admin approval required.
// =================================

const requestAccountDeletion = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const user_id = Number(req.user.user_id);
        const { current_password, reason } = req.body || {};

        if (!current_password) {
            return res.status(400).json({ message: "Current password is required" });
        }

        const [rows] = await connection.query(
            `SELECT user_id, role_id, full_name, email, password_hash, status, deleted_at
             FROM users WHERE user_id = ? LIMIT 1`,
            [user_id]
        );

        if (rows.length === 0 || rows[0].deleted_at) {
            return res.status(404).json({ message: "Account not found" });
        }

        const user = rows[0];
        const passwordOk = await bcrypt.compare(current_password, user.password_hash);
        if (!passwordOk) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        await connection.beginTransaction();

        // Donors may leave immediately without administrator approval.
        if (Number(user.role_id) === 5) {
            await closeAccount(connection, user_id);
            await connection.query(
                `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
                 VALUES (?, 'DELETE', 'USER', ?, ?)`,
                [user_id, user_id, `Donor account ${user.email} deleted by account owner`]
            );
            await connection.commit();
            return res.json({
                message: "Your account has been deleted",
                deleted: true,
                approval_required: false
            });
        }

        const [pending] = await connection.query(
            `SELECT request_id FROM account_deletion_requests
             WHERE user_id = ? AND status = 'PENDING' LIMIT 1`,
            [user_id]
        );
        if (pending.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: "An account deletion request is already pending" });
        }

        const cleanReason = reason ? String(reason).trim().slice(0, 255) : null;
        const [requestResult] = await connection.query(
            `INSERT INTO account_deletion_requests (user_id, reason) VALUES (?, ?)`,
            [user_id, cleanReason]
        );

        // Requesting to leave immediately suspends access while an admin reviews it.
        await connection.query(`UPDATE users SET status = 'INACTIVE' WHERE user_id = ?`, [user_id]);
        if (Number(user.role_id) === 4) {
            await connection.query(`UPDATE volunteers SET availability = 'INACTIVE' WHERE user_id = ?`, [user_id]);
        }

        await connection.query(
            `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
             VALUES (?, 'DELETE_REQUEST', 'USER', ?, ?)`,
            [user_id, user_id, `Account deletion requested by ${user.email}; awaiting administrator approval`]
        );

        await connection.commit();
        return res.json({
            message: "Deletion request sent to administrators. Your access is paused until the request is reviewed.",
            request_id: requestResult.insertId,
            deleted: false,
            approval_required: true
        });
    } catch (error) {
        try { await connection.rollback(); } catch (_) { /* no-op */ }
        console.error("Account deletion request error:", error);
        return res.status(500).json({ message: "Could not process account deletion", error: error.message });
    } finally {
        connection.release();
    }
};


module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    requestAccountDeletion
};
