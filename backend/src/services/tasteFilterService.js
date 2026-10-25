const { sequelize } = require("../models");

/**
 * KHẨU VỊ NGƯỜI DÙNG → lọc / ưu tiên món (phương án "kết hợp" đã được duyệt):
 *  - Lựa chọn kiểu TRÁNH → LỌC CỨNG (có thể tạm tắt bằng ?taste_filter=off ở màn Tìm kiếm):
 *      Không ăn cay  → loại món có ớt / sa tế / tương ớt (spicy_level ≥ 1)
 *      Ăn nhạt      → loại món đậm/mặn (salty_level = 3, > 1200 mg natri / khẩu phần)
 *      Ít ngọt      → loại món ngọt (sweet_level = 3, > 10 g đường / khẩu phần)
 *      Ít dầu mỡ    → loại món nhiều béo (fat_level = 3, > 18 g chất béo / khẩu phần)
 *  - Lựa chọn kiểu THÍCH → CHỈ ƯU TIÊN (đưa lên đầu, không ẩn món khác):
 *      Cay nhẹ → món cay nhẹ · Thích cay → món cay · Đậm đà → món đậm · Thích ngọt → món ngọt
 * Món chưa có hồ sơ vị (vừa tạo, chưa tính) KHÔNG bị lọc.
 */
const TASTE_CHOICES = {
    spicy: ['none', 'mild', 'love'],
    salty: ['light', 'normal', 'rich'],
    sweet: ['less', 'normal', 'love'],
    oily: ['less', 'normal'],
};

const TASTE_LABELS = {
    spicy: { none: 'Không ăn cay', mild: 'Cay nhẹ', love: 'Thích cay' },
    salty: { light: 'Ăn nhạt', normal: 'Mặn vừa', rich: 'Đậm đà' },
    sweet: { less: 'Ít ngọt', normal: 'Ngọt vừa', love: 'Thích ngọt' },
    oily: { less: 'Ít dầu mỡ', normal: 'Dầu mỡ bình thường' },
};

/** Chuẩn hoá dữ liệu khẩu vị (bỏ giá trị lạ) → { spicy, salty, sweet, oily } (null = không đặt) */
function normalizeTastePreferences(input) {
    let raw = input;
    if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch { raw = null; }
    }
    const out = { spicy: null, salty: null, sweet: null, oily: null };
    if (!raw || typeof raw !== 'object') return out;
    for (const key of Object.keys(TASTE_CHOICES)) {
        if (TASTE_CHOICES[key].includes(raw[key])) out[key] = raw[key];
    }
    return out;
}

const profileHas = (condition) => sequelize.literal(`NOT EXISTS (
    SELECT 1 FROM recipe_taste_profile tp
    WHERE tp.recipe_id = "recipe"."id" AND ${condition}
)`);

/** Điều kiện lọc cứng cho các lựa chọn kiểu "tránh" */
function tasteFilterConditions(prefs) {
    const p = normalizeTastePreferences(prefs);
    const conditions = [];
    if (p.spicy === 'none') conditions.push(profileHas('tp.spicy_level >= 1'));
    if (p.salty === 'light') conditions.push(profileHas('tp.salty_level >= 3'));
    if (p.sweet === 'less') conditions.push(profileHas('tp.sweet_level >= 3'));
    if (p.oily === 'less') conditions.push(profileHas('tp.fat_level >= 3'));
    return conditions;
}

/** Biểu thức sắp xếp ưu tiên món hợp khẩu vị "thích" (null nếu không có lựa chọn nào) */
function tasteBoostOrder(prefs) {
    const p = normalizeTastePreferences(prefs);
    const terms = [];
    if (p.spicy === 'mild') terms.push('(CASE WHEN tp.spicy_level = 1 THEN 1 ELSE 0 END)');
    if (p.spicy === 'love') terms.push('(CASE WHEN tp.spicy_level >= 1 THEN tp.spicy_level ELSE 0 END)');
    if (p.salty === 'rich') terms.push('(CASE WHEN tp.salty_level = 3 THEN 1 ELSE 0 END)');
    if (p.sweet === 'love') terms.push('(CASE WHEN tp.sweet_level = 3 THEN 1 ELSE 0 END)');
    if (terms.length === 0) return null;
    return [sequelize.literal(`COALESCE((
        SELECT ${terms.join(' + ')} FROM recipe_taste_profile tp WHERE tp.recipe_id = "recipe"."id"
    ), 0)`), 'DESC'];
}

/** Thuộc tính `taste` gắn vào mỗi món trong danh sách (để app hiện nhãn 🌶 🧂 🍬 🫒) */
const TASTE_ATTRIBUTE = [sequelize.literal(`(
    SELECT json_build_object('spicy', tp.spicy_level, 'salty', tp.salty_level, 'sweet', tp.sweet_level, 'fat', tp.fat_level, 'sour', tp.sour_level)
    FROM recipe_taste_profile tp WHERE tp.recipe_id = "recipe"."id"
)`), 'taste'];

/** Mô tả khẩu vị bằng chữ (cho trợ lý AI) */
function describeTastePreferences(prefs) {
    const p = normalizeTastePreferences(prefs);
    return Object.entries(p).filter(([, v]) => v).map(([k, v]) => TASTE_LABELS[k][v]);
}

module.exports = {
    TASTE_CHOICES,
    TASTE_LABELS,
    TASTE_ATTRIBUTE,
    normalizeTastePreferences,
    tasteFilterConditions,
    tasteBoostOrder,
    describeTastePreferences,
};
