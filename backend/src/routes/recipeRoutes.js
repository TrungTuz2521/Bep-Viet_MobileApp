const express = require("express");
const router = express.Router();
const recipeController = require("../controllers/recipeController");
const { authMiddleware, optionalAuthMiddleware } = require("../middlewares/authMiddleware");

// List recipes (Guest & User, phân trang, lọc dị ứng, danh mục, tìm kiếm)
router.get("/", optionalAuthMiddleware, recipeController.getRecipes);

// Discovery (Guest & User)
router.get("/discover", optionalAuthMiddleware, recipeController.getDiscover);

// Search (Guest & User)
router.get("/search", optionalAuthMiddleware, recipeController.getRecipes);


// Categories
router.get("/categories", recipeController.getCategories);

// Details (Guest & User)
router.get("/:slug", optionalAuthMiddleware, recipeController.getRecipeDetails);

// Ghi nhận lượt xem (Guest & User) — tách khỏi GET chi tiết để client có thể tải trước
router.post("/:id/view", optionalAuthMiddleware, recipeController.trackView);

// Finish Cooking (User only)
router.post("/:id/finish-cooking", authMiddleware, recipeController.finishCooking);

module.exports = router;
