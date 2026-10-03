const crypto = require('crypto');

/**
 * Safely closes an account without breaking historical foreign keys.
 * The users row is retained as an anonymized tombstone, while role-specific
 * live links are detached so the account no longer participates in operations.
 */
async function closeAccount(connection, userId) {
  const [rows] = await connection.query(
    `SELECT user_id, role_id, full_name, email FROM users WHERE user_id = ? FOR UPDATE`,
    [userId]
  );

  if (rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const user = rows[0];
  const suffix = `${userId}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const deletedEmail = `deleted_${suffix}@reliefsync.local`;
  const deletedName = `Deleted User #${userId}`;

  if (Number(user.role_id) === 2) {
    await connection.query(`DELETE FROM shelter_managers WHERE user_id = ?`, [userId]);
  }

  if (Number(user.role_id) === 4) {
    await connection.query(
      `UPDATE volunteers SET user_id = NULL, availability = 'INACTIVE' WHERE user_id = ?`,
      [userId]
    );
  }

  if (Number(user.role_id) === 5) {
    await connection.query(`UPDATE donors SET user_id = NULL WHERE user_id = ?`, [userId]);
  }

  await connection.query(
    `UPDATE users
     SET status = 'INACTIVE',
         full_name = ?,
         email = ?,
         phone = NULL,
         password_hash = ?,
         deleted_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [deletedName, deletedEmail, crypto.randomBytes(48).toString('hex'), userId]
  );

  return user;
}

module.exports = { closeAccount };
