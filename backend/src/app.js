const express = require("express");
const cors = require("cors");
const compression = require("compression");

const app = express();

// Chạy sau proxy của Render: lấy IP thật của người dùng từ X-Forwarded-For.
// Thiếu dòng này mọi khách chưa đăng nhập có chung 1 IP (của proxy) → dùng chung hạn mức trợ lý AI.
app.set("trust proxy", 1);

app.use(cors());
// Nén gzip mọi response JSON (danh sách 500 món: ~500KB → ~55KB)
app.use(compression());

// Ảnh món ăn gửi dạng base64 (≤5MB ảnh ≈ 7MB JSON) → route tải ảnh tự đọc body với giới hạn riêng,
// mọi route khác giữ giới hạn mặc định 100KB
const UPLOAD_IMAGE_PATH = "/api/library/upload-image";
const jsonParser = express.json();
app.use((req, res, next) => (req.path === UPLOAD_IMAGE_PATH ? next() : jsonParser(req, res, next)));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Backend is running",
    });
});

const routes = require("./routes");
app.use("/api", routes);

module.exports = app;