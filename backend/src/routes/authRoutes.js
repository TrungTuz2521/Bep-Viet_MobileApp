const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { createRateLimiter } = require("../middlewares/rateLimit");

// Đổi ảnh đại diện: tối đa 10 lần / 10 phút mỗi tài khoản
const avatarLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: "Bạn đổi ảnh quá nhanh, vui lòng thử lại sau ít phút.",
});

// Public Routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected Routes (Require Login)
router.get("/profile", authMiddleware, authController.getProfile);
router.post("/refresh", authMiddleware, authController.refreshSession);
router.put("/profile", authMiddleware, authController.updateProfile);
router.post("/avatar", authMiddleware, avatarLimiter, express.json({ limit: "8mb" }), authController.uploadAvatar);
router.put("/change-password", authMiddleware, authController.changePassword);
router.delete("/account", authMiddleware, authController.deleteAccount);

module.exports = router;
