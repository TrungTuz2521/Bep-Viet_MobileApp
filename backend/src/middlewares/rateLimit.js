// ─────────────────────────────────────────────────────────────────────────────
// Giới hạn số lượt gọi (in-memory, không cần thư viện ngoài).
// Dùng cho API trợ lý AI để tránh spam làm tăng chi phí Gemini.
// Lưu ý: bộ đếm nằm trong RAM của 1 tiến trình — khởi động lại server sẽ reset.
// ─────────────────────────────────────────────────────────────────────────────

const createRateLimiter = ({ windowMs, max, message }) => {
    const hits = new Map(); // key → { count, resetAt }

    // Dọn bộ đếm hết hạn định kỳ để không rò rỉ bộ nhớ
    const cleanup = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of hits) {
            if (entry.resetAt <= now) hits.delete(key);
        }
    }, windowMs);
    cleanup.unref?.();

    return (req, res, next) => {
        // Theo tài khoản nếu đã đăng nhập, ngược lại theo IP
        const key = req.user ? `u:${req.user.id}` : `ip:${req.ip}`;
        const now = Date.now();
        let entry = hits.get(key);
        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }
        entry.count += 1;

        if (entry.count > max) {
            const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
            res.set('Retry-After', String(retryAfterSec));
            return res.status(429).json({ success: false, message, retry_after_seconds: retryAfterSec });
        }
        next();
    };
};

module.exports = { createRateLimiter };
