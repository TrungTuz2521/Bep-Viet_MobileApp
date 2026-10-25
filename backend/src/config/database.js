require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    process.env.DB_NAME || "food_v2",
    process.env.DB_USER || "postgres",
    String(process.env.DB_PASSWORD || ""),
    {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        dialect: "postgres",
        logging: false,
        // DB ở xa (Supabase) → giữ sẵn kết nối để không tốn thêm round-trip mở kết nối,
        // cho phép nhiều truy vấn chạy song song (mặc định Sequelize chỉ max: 5)
        pool: {
            max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
            min: 1,
            acquire: 30000,
            idle: 30000,
        },
        define: {
            freezeTableName: true,
        },
    }
);

module.exports = sequelize;