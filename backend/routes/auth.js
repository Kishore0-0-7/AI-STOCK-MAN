const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");
const {
  validateLogin,
  validatePasswordChange,
  validateProfileUpdate,
} = require("../middleware/validation");

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validateLogin, authController.login);

// @route   GET /api/v1/auth/profile
// @desc    Get current user profile
// @access  Private
router.get("/profile", authenticateToken, authController.getProfile);

// @route   PUT /api/v1/auth/profile
// @desc    Update current user profile
// @access  Private
router.put(
  "/profile",
  authenticateToken,
  validateProfileUpdate,
  authController.updateProfile
);

// @route   PUT /api/v1/auth/change-password
// @desc    Change current user password
// @access  Private
router.put(
  "/change-password",
  authenticateToken,
  validatePasswordChange,
  authController.changePassword
);

module.exports = router;
