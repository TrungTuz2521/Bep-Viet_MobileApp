const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Public Routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected Routes (Require Login)
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);
router.put("/change-password", authMiddleware, authController.changePassword);
router.delete("/account", authMiddleware, authController.deleteAccount);

module.exports = router;
