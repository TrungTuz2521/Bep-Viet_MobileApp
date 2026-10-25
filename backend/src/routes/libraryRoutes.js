const express = require("express");
const router = express.Router();
const libraryController = require("../controllers/libraryController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { createRateLimiter } = require("../middlewares/rateLimit");

// Tải ảnh: tối đa 20 ảnh / 10 phút mỗi tài khoản (chống spam dung lượng lưu trữ)
const uploadLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: "Bạn tải ảnh quá nhanh, vui lòng thử lại sau ít phút.",
});

// ========================
// Saved Recipes (Chỉ lưu/bỏ lưu)
// ========================
router.get("/saved", authMiddleware, libraryController.getSavedRecipes);
router.post("/saved", authMiddleware, libraryController.saveRecipe);
router.delete("/saved/:recipe_id", authMiddleware, libraryController.unsaveRecipe);

// ========================
// My Recipes (CRUD)
// ========================
router.get("/my", authMiddleware, libraryController.getMyRecipes);
router.post("/my", authMiddleware, libraryController.createMyRecipe);
router.put("/my/:id", authMiddleware, libraryController.updateMyRecipe);
router.delete("/my/:id", authMiddleware, libraryController.deleteMyRecipe);
router.post("/my/:id/restore", authMiddleware, libraryController.restoreMyRecipe);
router.get("/trash", authMiddleware, libraryController.getTrashRecipes);

// Tải ảnh món ăn → URL công khai (Supabase Storage)
router.post(
    "/upload-image",
    authMiddleware,
    uploadLimiter,
    express.json({ limit: "8mb" }),
    libraryController.uploadRecipeImage
);

module.exports = router;
