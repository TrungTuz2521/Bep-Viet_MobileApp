// ─────────────────────────────────────────────────────────────────────────────
// Dùng chung cho TẠO / SỬA công thức của người dùng (libraryController):
// lọc trường được phép ghi, chuẩn hoá ảnh, số lượng, nguyên liệu, bước, danh mục.
// ─────────────────────────────────────────────────────────────────────────────
const { Op } = require("sequelize");
const { sequelize, ingredient, category } = require("../models");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (v) => UUID_RE.test(String(v || ""));

const VISIBILITIES = ["public", "private"];
const DIFFICULTIES = ["easy", "medium", "hard"];

/** Chuẩn hoá chuỗi tiếng Việt: NFC (bàn phím có thể gửi dạng tổ hợp), gộp khoảng trắng */
function cleanText(value, maxLength) {
    const s = String(value ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
    return maxLength ? s.slice(0, maxLength) : s;
}

/**
 * Chỉ nhận ảnh là URL http(s). Đường dẫn trong máy (file://, content://, ph://, data:)
 * chỉ mở được trên chính máy tạo → lưu null thay vì lưu ảnh hỏng.
 */
function sanitizeImageUrl(value) {
    const url = String(value ?? "").trim();
    return /^https?:\/\//i.test(url) ? url.slice(0, 1000) : null;
}

/** "0,5" → 0.5 · "1/2" → 0.5 · "1 1/2" → 1.5 · "200" → 200; không hợp lệ → null */
function parseQuantity(value) {
    if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
    const s = String(value ?? "").trim().replace(",", ".");
    let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (m) return Number(m[3]) > 0 ? Number(m[1]) + Number(m[2]) / Number(m[3]) : null;
    m = s.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
    if (m) return Number(m[2]) > 0 ? Number(m[1]) / Number(m[2]) : null;
    if (!/^\d+(?:\.\d+)?$/.test(s)) return null;
    const n = Number(s);
    return n > 0 ? n : null;
}

const toInt = (v, fallback, { min = 0, max = 10000 } = {}) => {
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(n, min), max);
};

/**
 * Whitelist trường thông tin món người dùng được phép ghi.
 * Chặn ghi đè owner_user_id, status, slug, view_count, popularity_score... qua body.
 * isCreate = false → chỉ trả các trường có trong body (sửa từng phần).
 */
function pickRecipeFields(body, { isCreate }) {
    const out = {};
    const has = (k) => isCreate || Object.prototype.hasOwnProperty.call(body, k);

    if (has("name")) out.name = cleanText(body.name, 255);
    if (has("description")) out.description = cleanText(body.description, 2000) || null;
    if (has("image_url")) out.image_url = sanitizeImageUrl(body.image_url);
    if (has("prep_time_minutes")) out.prep_time_minutes = toInt(body.prep_time_minutes, 0, { max: 1440 });
    if (has("cook_time_minutes")) out.cook_time_minutes = toInt(body.cook_time_minutes, 0, { max: 1440 });
    if (has("servings")) out.servings = toInt(body.servings, 1, { min: 1, max: 100 });
    // Món mới mặc định RIÊNG TƯ: chỉ chủ món thấy cho tới khi bật công khai
    if (has("visibility")) {
        out.visibility = VISIBILITIES.includes(body.visibility) ? body.visibility : "private";
    }
    if (has("difficulty") && body.difficulty !== undefined) {
        out.difficulty = DIFFICULTIES.includes(body.difficulty) ? body.difficulty : "medium";
    }
    return out;
}

/** Chỉ giữ category_id là UUID có thật trong DB (UUID sai định dạng trước đây gây lỗi 500) */
async function validCategoryIds(ids, transaction) {
    if (!Array.isArray(ids)) return null;
    const uuids = [...new Set(ids.filter(isUUID).map(String))].slice(0, 10);
    if (uuids.length === 0) return [];
    const rows = await category.findAll({ where: { id: uuids }, attributes: ["id"], raw: true, transaction });
    return rows.map((r) => r.id);
}

/**
 * Chuyển danh sách nguyên liệu người dùng nhập → bản ghi recipe_ingredient.
 * Ưu tiên ingredient_id (chọn từ gợi ý kho); nếu chỉ có tên → so khớp KHÔNG phân biệt
 * hoa/thường, khoảng trắng ("tôm " = "Tôm") để nguyên liệu vẫn thuộc đúng nhóm dị ứng.
 * Chỉ tạo nguyên liệu mới khi kho thật sự chưa có tên đó.
 */
async function buildRecipeIngredients(recipeId, list, transaction) {
    if (!Array.isArray(list)) return [];
    const items = list
        .filter(Boolean)
        .map((ing) => ({
            ingredient_id: isUUID(ing.ingredient_id) ? String(ing.ingredient_id) : null,
            name: cleanText(ing.name ?? ing.notes ?? ing.note, 100),
            quantity: parseQuantity(ing.quantity ?? ing.amount) ?? 1,
            unit: cleanText(ing.unit, 50) || "phần",
            note: cleanText(ing.note, 255) || null,
            group_name: cleanText(ing.group_name, 100) || null,
            is_optional: Boolean(ing.is_optional),
        }))
        .filter((ing) => ing.ingredient_id || ing.name)
        .slice(0, 100);
    if (items.length === 0) return [];

    // 1. ingredient_id gửi lên phải tồn tại thật
    const givenIds = [...new Set(items.map((i) => i.ingredient_id).filter(Boolean))];
    const existingIds = new Set(
        givenIds.length
            ? (await ingredient.findAll({ where: { id: givenIds }, attributes: ["id"], raw: true, transaction })).map((r) => r.id)
            : []
    );

    // 2. Tra theo tên (một truy vấn cho tất cả tên)
    const needName = items.filter((i) => !(i.ingredient_id && existingIds.has(i.ingredient_id)) && i.name);
    const keys = [...new Set(needName.map((i) => i.name.toLowerCase()))];
    const byKey = new Map();
    if (keys.length) {
        const rows = await ingredient.findAll({
            where: sequelize.where(sequelize.fn("lower", sequelize.fn("btrim", sequelize.col("name"))), { [Op.in]: keys }),
            attributes: ["id", "name"],
            order: [["name", "ASC"]],
            raw: true,
            transaction,
        });
        for (const r of rows) {
            const k = r.name.trim().toLowerCase();
            if (!byKey.has(k)) byKey.set(k, r.id);
        }
    }

    // 3. Tạo mới phần còn thiếu (viết hoa chữ đầu cho đồng bộ với kho: "Tôm", "Thịt heo")
    for (const item of needName) {
        const k = item.name.toLowerCase();
        if (byKey.has(k)) continue;
        const displayName = item.name.charAt(0).toLocaleUpperCase("vi") + item.name.slice(1);
        const created = await ingredient.create({ name: displayName, default_unit: item.unit }, { transaction });
        byKey.set(k, created.id);
    }

    const seen = new Set();
    const records = [];
    for (const item of items) {
        const id = item.ingredient_id && existingIds.has(item.ingredient_id)
            ? item.ingredient_id
            : byKey.get(item.name.toLowerCase());
        if (!id || seen.has(id)) continue; // cùng nguyên liệu nhập 2 lần → giữ dòng đầu
        seen.add(id);
        records.push({
            recipe_id: recipeId,
            ingredient_id: id,
            quantity: item.quantity,
            unit: item.unit,
            group_name: item.group_name,
            is_optional: item.is_optional,
            note: item.note,
        });
    }
    return records;
}

/** Bước nấu: bỏ bước trống, đánh số lại 1..n theo thứ tự gửi lên */
function buildRecipeSteps(recipeId, list) {
    if (!Array.isArray(list)) return [];
    return list
        .filter(Boolean)
        .map((s) => ({
            description: cleanText(s.description ?? s.instruction, 2000),
            duration_seconds: toInt(s.duration_seconds ?? s.timer_seconds, 0, { max: 86400 }),
            image_url: sanitizeImageUrl(s.image_url ?? s.media_url),
        }))
        .filter((s) => s.description)
        .slice(0, 100)
        .map((s, idx) => ({ recipe_id: recipeId, step_order: idx + 1, ...s }));
}

module.exports = {
    isUUID,
    cleanText,
    sanitizeImageUrl,
    parseQuantity,
    pickRecipeFields,
    validCategoryIds,
    buildRecipeIngredients,
    buildRecipeSteps,
};
