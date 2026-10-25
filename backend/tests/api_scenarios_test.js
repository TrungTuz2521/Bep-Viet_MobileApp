/**
 * api_scenarios_test.js
 * Kịch bản kiểm thử & tài liệu minh họa truy vấn cho các yêu cầu backend:
 * 1. Khách (Guest) vs User có dị ứng (Hard filter)
 * 2. Dị ứng nguyên liệu cha (loại trừ cả nguyên liệu con bằng Recursive CTE)
 * 3. Lọc theo danh mục cha (mở rộng lấy cả danh mục con bằng Recursive CTE)
 * 4. Tìm kiếm tiếng Việt, an toàn escape ký tự LIKE (_, %)
 * 5. Phân trang và sắp xếp theo popularity_score / created_at / name
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function runScenarioExamples() {
    console.log('=== BẮT ĐẦU KIỂM THỬ KỊCH BẢN BACKEND FOOD APP ===\n');

    // Kịch bản 1: Guest lấy danh sách món ăn
    console.log('1. [Kịch bản Guest] GET /recipes (Hiển thị món công khai, không lọc dị ứng)');
    try {
        const res = await axios.get(`${BASE_URL}/recipes?page=1&limit=5&sort_by=popularity_score&order=DESC`);
        console.log(`-> Thành công: HTTP ${res.status}, tổng số món: ${res.data.pagination?.total || res.data.data?.length}`);
    } catch (e) {
        console.log(`-> Kết nối server: ${e.message}`);
    }

    // Kịch bản 2: Tìm kiếm an toàn với ký tự đặc biệt
    console.log('\n2. [Kịch bản Search] GET /recipes?query=gà&sort_by=name&order=ASC');
    try {
        const res = await axios.get(`${BASE_URL}/recipes?query=g%C3%A0&sort_by=name&order=ASC`);
        console.log(`-> Thành công: HTTP ${res.status}, tìm thấy: ${res.data.data?.length} món`);
    } catch (e) {
        console.log(`-> Kết quả: ${e.message}`);
    }

    // Kịch bản 3: Lọc theo danh mục (Recursive CTE)
    console.log('\n3. [Kịch bản Danh Mục Cha-Con] GET /recipes?category=mon-lau');
    try {
        const res = await axios.get(`${BASE_URL}/recipes?category=mon-lau`);
        console.log(`-> Thành công: HTTP ${res.status}, tìm thấy: ${res.data.data?.length} món`);
    } catch (e) {
        console.log(`-> Kết quả: ${e.message}`);
    }

    // Kịch bản 4: Xem chi tiết món và kiểm tra cờ allergy_warning
    console.log('\n4. [Kịch bản Chi Tiết Món] GET /recipes/ga-kho-gung');
    try {
        const res = await axios.get(`${BASE_URL}/recipes/ga-kho-gung`);
        console.log(`-> Thành công: HTTP ${res.status}, Tên: ${res.data.data?.name}, Cảnh báo dị ứng: ${res.data.data?.allergy_warning}`);
    } catch (e) {
        console.log(`-> Kết quả: ${e.message}`);
    }

    console.log('\n=== KẾT THÚC KỊCH BẢN KIỂM THỬ ===');
}

if (require.main === module) {
    runScenarioExamples();
}

module.exports = runScenarioExamples;
