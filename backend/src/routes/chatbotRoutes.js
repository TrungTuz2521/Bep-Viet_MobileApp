const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const { optionalAuthMiddleware } = require("../middlewares/authMiddleware");
const { createRateLimiter } = require("../middlewares/rateLimit");

// Giới hạn lượt hỏi trợ lý (theo tài khoản, hoặc theo IP nếu là khách) để kiểm soát chi phí Gemini
const assistantLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000,
    max: parseInt(process.env.ASSISTANT_RATE_LIMIT, 10) || 30,
    message: "Bạn hỏi hơi nhanh rồi! Vui lòng đợi vài phút rồi hỏi tiếp nhé.",
});

// Route cho Chatbot (Guest và User đều dùng được)
router.post("/discover", optionalAuthMiddleware, assistantLimiter, chatbotController.discoverAssistant);

// Trợ lý hỏi đáp nhiều lượt (tìm món, hỏi về 1 món, thay nguyên liệu, dinh dưỡng, gợi ý cá nhân)
router.post("/chat", optionalAuthMiddleware, assistantLimiter, chatbotController.chatAssistant);

module.exports = router;
