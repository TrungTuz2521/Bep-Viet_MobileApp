require("dotenv").config();

const app = require("./app");
const sequelize = require("./config/database");

const PORT = process.env.PORT || 5000;

// Thiếu / quá ngắn JWT_SECRET → dừng ngay. Trước đây dùng chuỗi mặc định công khai trong code,
// ai đọc mã nguồn cũng tự ký được token đăng nhập vào mọi tài khoản.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error("Thiếu JWT_SECRET (tối thiểu 16 ký tự) trong biến môi trường. Server không khởi động.");
    process.exit(1);
}

const startServer = async () => {
    try {
        await sequelize.authenticate();

        console.log("PostgreSQL connected successfully.");

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Unable to connect to PostgreSQL:");
        console.error(error);
        process.exit(1);
    }
};

startServer();