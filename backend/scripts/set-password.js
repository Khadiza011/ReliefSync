/**
 * Set (or reset) the password of an existing user account.
 *
 *   npm run set-password -- <email> <new-password>
 *
 * Useful after importing the seed database, whose demo accounts ship with
 * unknown passwords. Uses the same bcrypt cost as the API (10 rounds).
 */
require("dotenv").config();

const bcrypt = require("bcrypt");
const db = require("../config/db");

async function main() {
    const [email, password] = process.argv.slice(2);

    if (!email || !password) {
        console.log("Usage: npm run set-password -- <email> <new-password>");
        process.exit(1);
    }

    if (password.length < 6) {
        console.log("Password must be at least 6 characters.");
        process.exit(1);
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
        "UPDATE users SET password_hash = ?, status = 'ACTIVE' WHERE email = ?",
        [hash, email.toLowerCase().trim()]
    );

    if (result.affectedRows === 0) {
        console.log(`No user found with email ${email}`);
        const [users] = await db.query("SELECT email, role_id FROM users ORDER BY role_id, email");
        console.log("Existing accounts:");
        users.forEach((u) => console.log(`  role ${u.role_id}  ${u.email}`));
        process.exit(1);
    }

    console.log(`Password updated for ${email}`);
    process.exit(0);
}

main().catch((err) => {
    console.error("Failed to set password:", err.message);
    process.exit(1);
});
