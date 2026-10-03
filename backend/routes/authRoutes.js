const express = require("express");

const router = express.Router();

const {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    requestAccountDeletion
} = require("../controllers/authController");

const {
    verifyToken
} = require("../middleware/authMiddleware");

const {
    checkRole
} = require("../middleware/roleMiddleware");

router.post("/register", register);
router.post("/login", login);

// All signed-in users can view and manage only their own profile.
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.put("/password", verifyToken, changePassword);
router.post("/delete-account", verifyToken, requestAccountDeletion);

// =================================
// ADMIN ONLY TEST ROUTE
// =================================
router.get(
    "/admin-test",
    verifyToken,
    checkRole(1),
    (req, res) => {
        res.json({
            message: "Welcome Admin",
            user: req.user
        });
    }
);

module.exports = router;
