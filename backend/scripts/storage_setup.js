// Tạo bucket lưu ảnh món ăn trên Supabase Storage (chạy lại nhiều lần không sao).
// Cách dùng: node scripts/storage_setup.js
require("dotenv").config();
const { BUCKET, ensureBucket, supabaseUrl } = require("../src/services/storageService");

(async () => {
    console.log(`Supabase: ${supabaseUrl() || "(chưa xác định)"} · bucket: ${BUCKET}`);
    const { created } = await ensureBucket();
    console.log(created ? "✔ Đã tạo bucket công khai." : "✔ Bucket đã có sẵn.");
})().catch((e) => {
    console.error("✖", e.message);
    process.exit(1);
});
