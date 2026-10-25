const express = require("express");
const router = express.Router();
const userPreferencesController = require("../controllers/userPreferencesController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Public Routes - Danh sách options cho màn hình sở thích
router.get("/allergy-options", userPreferencesController.getAllergyOptions);
router.get("/category-options", userPreferencesController.getCategoryOptions);
// Tìm nguyên liệu trong kho (chọn dị ứng từng nguyên liệu)
router.get("/ingredients", userPreferencesController.searchIngredients);

// Protected Routes for Preferences
router.get("/preferences", authMiddleware, userPreferencesController.getPreferences);
router.put("/preferences", authMiddleware, userPreferencesController.updatePreferences);

module.exports = router;
