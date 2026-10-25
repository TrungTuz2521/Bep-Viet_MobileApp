const { sequelize } = require("../models");

/**
 * HỒ SƠ VỊ CỦA MÓN (ước tính từ định lượng trong công thức, tính trên 1 khẩu phần).
 * Hệ số quy đổi là ƯỚC TÍNH (muỗng canh ≈ 15ml, muỗng cà phê ≈ 5ml) — không phải phân tích dinh dưỡng.
 * Ngưỡng chọn theo phân bố thực tế của 720 món + khuyến nghị WHO (natri < 2000mg/ngày, đường tự do < 25g/ngày).
 */

const UNIT_ALIASES = { 'trái': 'quả', 'muỗng canh': 'muỗng canh', 'muỗng cà phê': 'muỗng cà phê' };
const normUnit = (u) => {
    const unit = String(u || '').trim().toLowerCase();
    return UNIT_ALIASES[unit] || unit;
};

// mg natri / 1 đơn vị
const SODIUM = [
    [/^muối$/i, { 'muỗng cà phê': 2300, 'muỗng canh': 6900, g: 390 }],
    [/^nước mắm$/i, { 'muỗng canh': 1400, 'muỗng cà phê': 470, ml: 95 }],
    [/^nước tương$/i, { 'muỗng canh': 900, 'muỗng cà phê': 300, ml: 60 }],
    [/^mắm (tôm|nêm|ruốc|cáy|sặc|cá sặc|bò hóc|bồ hóc)$/i, { 'muỗng canh': 1200, 'muỗng cà phê': 400, g: 80 }],
    [/^muối tôm$/i, { g: 250, 'muỗng cà phê': 1200 }],
    [/^tương (hột|bần|xay)$/i, { 'muỗng canh': 600, 'muỗng cà phê': 200, g: 40 }],
    [/^dầu hào$/i, { 'muỗng canh': 500, 'muỗng cà phê': 170, ml: 33 }],
    [/^chao$/i, { g: 30, 'miếng': 300, 'muỗng canh': 450 }],
];

// gram đường / 1 đơn vị
const SUGAR = [
    [/^đường( bột| cát| nâu| phèn| thốt nốt)?$/i, { 'muỗng canh': 12, 'muỗng cà phê': 4, g: 1 }],
    [/^mật ong$/i, { 'muỗng canh': 17, 'muỗng cà phê': 6, ml: 1.2 }],
    [/^sữa đặc$/i, { 'muỗng canh': 10, 'muỗng cà phê': 3.5, ml: 0.55, g: 0.55 }],
    [/^mạch nha$/i, { 'muỗng canh': 15, g: 0.8 }],
    [/^mật mía$/i, { 'muỗng canh': 13, g: 0.7 }],
];

// điểm cay / 1 đơn vị. chili=true: thuộc nhóm "có ớt" (món "Không cay" không được chứa)
const SPICY = [
    [/^ớt (hiểm|xiêm)$/i, { quả: 2, g: 0.3 }, true],
    [/^ớt( đỏ| xanh| khô)?$/i, { quả: 1, g: 0.1 }, true],
    [/^ớt bột$/i, { 'muỗng cà phê': 2, 'muỗng canh': 6, g: 1 }, true],
    [/^(sa tế|tương ớt)$/i, { 'muỗng canh': 1.5, 'muỗng cà phê': 0.5 }, true],
    [/^mù tạt$/i, { 'muỗng cà phê': 1, 'muỗng canh': 3 }, true],
    // Tiêu: cay nhẹ, có điểm nhưng không tính là "có ớt"
    [/^tiêu( xay| hạt| xanh)?$/i, { 'muỗng cà phê': 0.4, g: 0.15 }, false],
];

// điểm chua / 1 đơn vị
const SOUR = [
    [/^chanh( vàng)?$/i, { quả: 1 }],
    [/^nước cốt (chanh|me)$/i, { 'muỗng canh': 0.7, 'muỗng cà phê': 0.25, ml: 0.05 }],
    [/^giấm( bỗng)?$/i, { 'muỗng canh': 1, 'muỗng cà phê': 0.35, ml: 0.07 }],
    [/^me( chua)?$/i, { g: 0.05 }],
    [/^khế$/i, { quả: 0.5, g: 0.005 }],
    [/^(tắc|quất)$/i, { quả: 0.3 }],
    [/^mẻ$/i, { 'muỗng canh': 1, 'muỗng cà phê': 0.35 }],
    [/^quả sấu$/i, { quả: 0.5 }],
    [/^chanh dây$/i, { quả: 0.5 }],
];

// Ngưỡng / khẩu phần → mức (đã được bạn duyệt)
const LEVELS = {
    salty: (mg) => (mg <= 600 ? 1 : mg <= 1200 ? 2 : 3),          // 1 nhạt · 2 vừa · 3 đậm/mặn
    sweet: (g) => (g <= 3 ? 1 : g <= 10 ? 2 : 3),                  // 1 ít ngọt · 2 vừa · 3 ngọt
    spicy: (hasChili, score) => (!hasChili ? 0 : score <= 0.5 ? 1 : 2), // 0 không cay · 1 cay nhẹ · 2 cay
    fat: (g) => (g === null || Number.isNaN(g) ? null : g <= 8 ? 1 : g <= 18 ? 2 : 3), // 1 ít · 2 vừa · 3 nhiều
    sour: (score) => (score >= 0.25 ? 1 : 0),                      // 0 không chua · 1 chua
};

function lookup(table, name, unit, qty) {
    const n = String(name || '').trim();
    for (const [re, units, flag] of table) {
        if (re.test(n)) {
            const q = Number(qty);
            // Không rõ định lượng / đơn vị lạ: vẫn tính "có mặt" ở mức 1 đơn vị nhỏ nhất (thận trọng)
            const perUnit = units[normUnit(unit)];
            const amount = perUnit !== undefined && q > 0 ? perUnit * q : Math.min(...Object.values(units));
            return { amount, flag: Boolean(flag), matched: true };
        }
    }
    return { amount: 0, flag: false, matched: false };
}

/** Tính hồ sơ vị cho 1 món từ danh sách nguyên liệu (chưa chia khẩu phần) */
function computeProfile({ servings, fat_grams }, ingredients) {
    let sodium = 0, sugar = 0, spicy = 0, sour = 0, hasChili = false;
    for (const ing of ingredients) {
        sodium += lookup(SODIUM, ing.name, ing.unit, ing.quantity).amount;
        sugar += lookup(SUGAR, ing.name, ing.unit, ing.quantity).amount;
        const sp = lookup(SPICY, ing.name, ing.unit, ing.quantity);
        spicy += sp.amount;
        if (sp.matched && sp.flag) hasChili = true;
        sour += lookup(SOUR, ing.name, ing.unit, ing.quantity).amount;
    }
    const s = Number(servings) > 0 ? Number(servings) : 4;
    const fat = fat_grams === null || fat_grams === undefined ? null : Number(fat_grams);
    const per = { sodium: sodium / s, sugar: sugar / s, spicy: spicy / s, sour: sour / s };
    return {
        sodium_mg: Math.round(per.sodium * 10) / 10,
        sugar_g: Math.round(per.sugar * 10) / 10,
        spicy_score: Math.round(per.spicy * 100) / 100,
        has_chili: hasChili,
        sour_score: Math.round(per.sour * 100) / 100,
        fat_g: fat,
        salty_level: LEVELS.salty(per.sodium),
        sweet_level: LEVELS.sweet(per.sugar),
        spicy_level: LEVELS.spicy(hasChili, per.spicy),
        fat_level: LEVELS.fat(fat),
        sour_level: LEVELS.sour(per.sour),
    };
}

/**
 * Tính lại & lưu hồ sơ vị. recipeIds = null → tính cho TẤT CẢ món.
 * @returns {Promise<number>} số món đã cập nhật
 */
async function recomputeTasteProfiles(recipeIds = null) {
    const where = recipeIds ? 'WHERE r.id IN (:ids)' : '';
    const [rows] = await sequelize.query(`
        SELECT r.id, r.servings, r.fat_grams, i.name, ri.quantity, ri.unit
        FROM recipe r
        LEFT JOIN recipe_ingredient ri ON ri.recipe_id = r.id
        LEFT JOIN ingredient i ON i.id = ri.ingredient_id
        ${where}
    `, { replacements: { ids: recipeIds || [] } });

    const byRecipe = new Map();
    for (const r of rows) {
        const entry = byRecipe.get(r.id) || { meta: { servings: r.servings, fat_grams: r.fat_grams }, ings: [] };
        if (r.name) entry.ings.push({ name: r.name, quantity: r.quantity, unit: r.unit });
        byRecipe.set(r.id, entry);
    }

    const profiles = [...byRecipe.entries()].map(([id, e]) => ({ recipe_id: id, ...computeProfile(e.meta, e.ings) }));
    // Upsert theo lô để giảm số round-trip tới DB
    const BATCH = 200;
    for (let i = 0; i < profiles.length; i += BATCH) {
        const chunk = profiles.slice(i, i + BATCH);
        const values = [];
        const rep = {};
        chunk.forEach((p, j) => {
            const keys = Object.keys(p);
            values.push(`(${keys.map((k) => `:${k}${j}`).join(', ')}, NOW())`);
            keys.forEach((k) => { rep[`${k}${j}`] = p[k]; });
        });
        const cols = Object.keys(chunk[0]);
        await sequelize.query(`
            INSERT INTO recipe_taste_profile (${cols.join(', ')}, computed_at)
            VALUES ${values.join(', ')}
            ON CONFLICT (recipe_id) DO UPDATE SET
            ${cols.filter((c) => c !== 'recipe_id').map((c) => `${c} = EXCLUDED.${c}`).join(', ')},
            computed_at = NOW()
        `, { replacements: rep });
    }
    return profiles.length;
}

module.exports = { computeProfile, recomputeTasteProfiles, LEVELS };
