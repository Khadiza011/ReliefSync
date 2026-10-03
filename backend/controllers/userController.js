const db = require('../config/db');
const bcrypt = require('bcrypt');
const { closeAccount } = require('../utils/accountDeletion');

const ROLE_MAP = { ADMIN: 1, SHELTER_MANAGER: 2, RELIEF_MANAGER: 3, VOLUNTEER: 4, DONOR: 5 };

// =================================
// LIST ALL USERS (ADMIN)
// Shelter managers include the shelter(s) they manage.
// =================================

const listUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
          u.user_id, u.role_id, u.full_name, u.email, u.phone, u.status, u.created_at,
          GROUP_CONCAT(DISTINCT s.shelter_name ORDER BY s.shelter_name SEPARATOR ', ') AS shelter_names,
          GROUP_CONCAT(DISTINCT s.shelter_id ORDER BY s.shelter_id) AS shelter_ids
       FROM users u
       LEFT JOIN shelter_managers sm ON sm.user_id = u.user_id
       LEFT JOIN shelters s ON s.shelter_id = sm.shelter_id
       WHERE u.deleted_at IS NULL
       GROUP BY u.user_id
       ORDER BY u.created_at DESC, u.user_id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not load users', error: err.message });
  }
};

// =================================
// CREATE USER WITH ANY ROLE (ADMIN)
// A shelter manager must be assigned to a shelter.
// =================================

const createUser = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { full_name, email, password, phone, role } = req.body;
    const roleName = String(role || '').toUpperCase();
    const role_id = ROLE_MAP[roleName];
    const name = String(full_name || '').trim();
    const normalizedEmail = String(email || '').toLowerCase().trim();
    const shelter_id = req.body.shelter_id ? Number(req.body.shelter_id) : null;

    if (!name || !normalizedEmail || !password || !role_id) return res.status(400).json({ message: 'Name, email, password and valid role are required' });
    if (String(password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ message: 'Invalid email format' });

    if (role_id === 2) {
      if (!shelter_id) return res.status(400).json({ message: 'Choose the shelter this manager will manage' });
      const [shelter] = await connection.query('SELECT shelter_id FROM shelters WHERE shelter_id = ? LIMIT 1', [shelter_id]);
      if (shelter.length === 0) return res.status(400).json({ message: 'Selected shelter does not exist' });
    }

    const [existing] = await connection.query('SELECT user_id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (existing.length) return res.status(400).json({ message: 'Email already exists' });

    await connection.beginTransaction();
    const hash = await bcrypt.hash(password, 10);
    const [result] = await connection.query(
      `INSERT INTO users (role_id, full_name, email, password_hash, phone, status) VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
      [role_id, name, normalizedEmail, hash, phone || null]
    );
    const user_id = result.insertId;

    if (role_id === 2) {
      await connection.query('INSERT INTO shelter_managers (shelter_id, user_id) VALUES (?, ?)', [shelter_id, user_id]);
    }
    if (role_id === 4) {
      await connection.query(`INSERT INTO volunteers (user_id, volunteer_code, volunteer_name, phone, email, availability) VALUES (?, ?, ?, ?, ?, 'AVAILABLE')`, [user_id, `VOL-U${user_id}`, name, phone || null, normalizedEmail]);
    }
    if (role_id === 5) {
      await connection.query(`INSERT INTO donors (user_id, donor_code, donor_name, donor_type, phone, email) VALUES (?, ?, ?, 'INDIVIDUAL', ?, ?)`, [user_id, `DNR-U${user_id}`, name, phone || null, normalizedEmail]);
    }

    await connection.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description) VALUES (?, 'INSERT', 'USER', ?, ?)`,
      [req.user.user_id, user_id, `Account created for ${normalizedEmail} as ${roleName}${shelter_id && role_id === 2 ? ` (shelter ID ${shelter_id})` : ''}`]
    );

    await connection.commit();
    res.status(201).json({ message: 'User created successfully', user_id, role: roleName });
  } catch (err) {
    try { await connection.rollback(); } catch (_) { /* no-op */ }
    res.status(500).json({ message: 'Could not create user', error: err.message });
  } finally {
    connection.release();
  }
};

// =================================
// ACTIVATE / DEACTIVATE A USER (ADMIN)
// An administrator cannot lock their own account.
// =================================

const updateUserStatus = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const target = Number(req.params.id);
    const status = String(req.body.status || '').toUpperCase();

    if (!Number.isInteger(target) || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE' });
    }
    if (target === req.user.user_id) {
      return res.status(400).json({ message: 'You cannot change the status of your own account' });
    }

    await connection.beginTransaction();

    const [users] = await connection.query('SELECT user_id, role_id, email FROM users WHERE user_id = ? FOR UPDATE', [target]);
    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    if (status === 'ACTIVE') {
      const [pendingDeletion] = await connection.query(
        `SELECT request_id FROM account_deletion_requests WHERE user_id = ? AND status = 'PENDING' LIMIT 1`,
        [target]
      );
      if (pendingDeletion.length > 0) {
        await connection.rollback();
        return res.status(409).json({ message: 'This user has a pending account deletion request. Approve or reject that request first.' });
      }
    }

    await connection.query('UPDATE users SET status = ? WHERE user_id = ?', [status, target]);

    // Keep the volunteer profile in step with the account
    if (users[0].role_id === 4) {
      if (status === 'INACTIVE') {
        await connection.query(`UPDATE volunteers SET availability = 'INACTIVE' WHERE user_id = ?`, [target]);
      } else {
        await connection.query(
          `UPDATE volunteers v
           SET v.availability = IF(EXISTS (
               SELECT 1 FROM assignments a WHERE a.volunteer_id = v.volunteer_id AND a.status = 'ACTIVE'
           ), 'BUSY', 'AVAILABLE')
           WHERE v.user_id = ?`,
          [target]
        );
      }
    }

    await connection.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description) VALUES (?, 'UPDATE', 'USER', ?, ?)`,
      [req.user.user_id, target, `Account ${users[0].email} set to ${status}`]
    );

    await connection.commit();
    res.json({ message: status === 'ACTIVE' ? 'User activated' : 'User deactivated', user_id: target, status });
  } catch (err) {
    try { await connection.rollback(); } catch (_) { /* no-op */ }
    res.status(500).json({ message: 'Could not update user', error: err.message });
  } finally {
    connection.release();
  }
};

// =================================
// MOVE A SHELTER MANAGER TO ANOTHER SHELTER (ADMIN)
// =================================

const assignManagerShelter = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const target = Number(req.params.id);
    const shelter_id = Number(req.body.shelter_id);

    if (!Number.isInteger(target) || !Number.isInteger(shelter_id)) {
      return res.status(400).json({ message: 'User and shelter are required' });
    }

    await connection.beginTransaction();

    const [users] = await connection.query('SELECT user_id, role_id FROM users WHERE user_id = ? FOR UPDATE', [target]);
    if (users.length === 0 || users[0].role_id !== 2) {
      await connection.rollback();
      return res.status(400).json({ message: 'Only shelter managers can be assigned to a shelter' });
    }
    const [shelter] = await connection.query('SELECT shelter_id, shelter_name FROM shelters WHERE shelter_id = ?', [shelter_id]);
    if (shelter.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Shelter not found' });
    }

    await connection.query('DELETE FROM shelter_managers WHERE user_id = ?', [target]);
    await connection.query('INSERT INTO shelter_managers (shelter_id, user_id) VALUES (?, ?)', [shelter_id, target]);

    await connection.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description) VALUES (?, 'UPDATE', 'USER', ?, ?)`,
      [req.user.user_id, target, `Shelter manager assigned to ${shelter[0].shelter_name}`]
    );

    await connection.commit();
    res.json({ message: `Manager assigned to ${shelter[0].shelter_name}` });
  } catch (err) {
    try { await connection.rollback(); } catch (_) { /* no-op */ }
    res.status(500).json({ message: 'Could not assign shelter', error: err.message });
  } finally {
    connection.release();
  }
};


// =================================
// ACCOUNT DELETION REQUESTS (ADMIN)
// =================================

const listDeletionRequests = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT adr.request_id, adr.user_id, adr.reason, adr.status, adr.requested_at,
              u.full_name, u.email, u.role_id
       FROM account_deletion_requests adr
       JOIN users u ON u.user_id = adr.user_id
       WHERE adr.status = 'PENDING'
       ORDER BY adr.requested_at ASC, adr.request_id ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not load deletion requests', error: err.message });
  }
};

const resolveDeletionRequest = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const requestId = Number(req.params.requestId);
    const decision = String(req.body.decision || '').toUpperCase();
    const note = req.body.note ? String(req.body.note).trim().slice(0, 255) : null;

    if (!Number.isInteger(requestId) || !['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ message: 'Valid request and decision are required' });
    }

    await connection.beginTransaction();

    const [requests] = await connection.query(
      `SELECT adr.*, u.email, u.role_id, u.deleted_at
       FROM account_deletion_requests adr
       JOIN users u ON u.user_id = adr.user_id
       WHERE adr.request_id = ? FOR UPDATE`,
      [requestId]
    );

    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Deletion request not found' });
    }

    const request = requests[0];
    if (request.status !== 'PENDING') {
      await connection.rollback();
      return res.status(409).json({ message: 'This request has already been reviewed' });
    }

    if (Number(request.user_id) === Number(req.user.user_id)) {
      await connection.rollback();
      return res.status(403).json({ message: 'You cannot approve or reject your own account deletion request' });
    }

    if (decision === 'APPROVED') {
      await closeAccount(connection, Number(request.user_id));
    } else {
      await connection.query(
        `UPDATE users SET status = 'ACTIVE' WHERE user_id = ? AND deleted_at IS NULL`,
        [request.user_id]
      );

      if (Number(request.role_id) === 4) {
        await connection.query(
          `UPDATE volunteers v
           SET v.availability = IF(EXISTS (
               SELECT 1 FROM assignments a
               WHERE a.volunteer_id = v.volunteer_id AND a.status = 'ACTIVE'
           ), 'BUSY', 'AVAILABLE')
           WHERE v.user_id = ?`,
          [request.user_id]
        );
      }
    }

    await connection.query(
      `UPDATE account_deletion_requests
       SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, review_note = ?
       WHERE request_id = ?`,
      [decision, req.user.user_id, note, requestId]
    );

    await connection.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, ?, 'USER', ?, ?)`,
      [
        req.user.user_id,
        decision === 'APPROVED' ? 'DELETE' : 'UPDATE',
        request.user_id,
        decision === 'APPROVED'
          ? `Account deletion approved for ${request.email}`
          : `Account deletion rejected for ${request.email}; account restored`
      ]
    );

    await connection.commit();
    res.json({
      message: decision === 'APPROVED' ? 'Account deletion approved' : 'Deletion request rejected and account restored',
      request_id: requestId,
      status: decision
    });
  } catch (err) {
    try { await connection.rollback(); } catch (_) { /* no-op */ }
    res.status(err.statusCode || 500).json({ message: err.message || 'Could not review deletion request' });
  } finally {
    connection.release();
  }
};

module.exports = { listUsers, createUser, updateUserStatus, assignManagerShelter, listDeletionRequests, resolveDeletionRequest };
