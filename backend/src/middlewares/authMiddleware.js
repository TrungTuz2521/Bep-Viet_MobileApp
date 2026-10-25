const jwt = require("jsonwebtoken");
const { user } = require("../models");

// ─────────────────────────────────────────────────────────────────────────────
// Cache user ngắn hạn: DB ở xa (~100ms/truy vấn) nên tránh findByPk ở MỌI request.
// Các thay đổi qua req.user.update() sửa trực tiếp instance đã cache nên luôn đồng bộ.
// Thay đổi từ bên ngoài (vd: admin khóa tài khoản trong DB) có hiệu lực sau tối đa TTL.
// ─────────────────────────────────────────────────────────────────────────────
const USER_CACHE_TTL_MS = 60 * 1000;
const USER_CACHE_MAX = 1000;
const userCache = new Map();

const getUserCached = async (userId) => {
    const now = Date.now();
    const hit = userCache.get(userId);
    if (hit && hit.expiresAt > now) {
        return hit.user;
    }

    const foundUser = await user.findByPk(userId);
    if (foundUser) {
        // Giới hạn kích thước: xóa bản ghi cũ nhất khi đầy
        if (userCache.size >= USER_CACHE_MAX) {
            userCache.delete(userCache.keys().next().value);
        }
        userCache.set(userId, { user: foundUser, expiresAt: now + USER_CACHE_TTL_MS });
    } else {
        userCache.delete(userId);
    }
    return foundUser;
};

// Gọi khi tài khoản bị xóa / đổi mật khẩu để request sau đọc lại từ DB
const invalidateUserCache = (userId) => {
    if (userId) userCache.delete(userId);
};

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Unauthorized. Token missing." });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const foundUser = await getUserCached(decoded.id);
        if (!foundUser) {
            return res.status(401).json({ success: false, message: "User not found." });
        }

        // Kiểm tra soft delete và trạng thái suspended
        if (foundUser.deleted_at) {
            return res.status(403).json({ success: false, message: "Tài khoản đã bị vô hiệu hóa." });
        }
        if (foundUser.status === "suspended") {
            return res.status(403).json({ success: false, message: "Tài khoản của bạn đã bị khóa." });
        }

        req.user = foundUser;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }
};

const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const foundUser = await getUserCached(decoded.id);
            if (foundUser && !foundUser.deleted_at && foundUser.status !== "suspended") {
                req.user = foundUser;
            }
        }
        next();
    } catch (error) {
        // Token is invalid/expired, act as Guest
        next();
    }
};

module.exports = { authMiddleware, optionalAuthMiddleware, invalidateUserCache };
