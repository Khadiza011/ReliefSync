const express = require('express');
const router = express.Router();
const { listUsers, createUser, updateUserStatus, assignManagerShelter, listDeletionRequests, resolveDeletionRequest } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All user administration is admin-only
router.get('/deletion-requests', verifyToken, checkRole(1), listDeletionRequests);
router.put('/deletion-requests/:requestId', verifyToken, checkRole(1), resolveDeletionRequest);
router.get('/', verifyToken, checkRole(1), listUsers);
router.post('/', verifyToken, checkRole(1), createUser);
router.put('/:id/status', verifyToken, checkRole(1), updateUserStatus);
router.put('/:id/shelter', verifyToken, checkRole(1), assignManagerShelter);

module.exports = router;
