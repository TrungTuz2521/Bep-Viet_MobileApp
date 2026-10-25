const { recipe, recipe_ingredient, ingredient, step, sequelize } = require("../models");
const { Op } = require("sequelize");
const { searchRecipesSafe, escapeLike } = require("./recipeSearchService");
const { getUserAllergenIngredients } = require("./allergyService");
const { describeTastePreferences } = require("./tasteFilterService");

// Mức vị của món (recipe_taste_profile) → mô tả chữ cho trợ lý, vd "cay nhẹ, đậm/mặn"
const TASTE_TEXT = {
    spicy: { 0: "không cay", 1: "cay nhẹ", 2: "cay" },
    salty: { 1: "nhạt", 2: "mặn vừa", 3: "đậm/mặn" },
    sweet: { 1: "ít ngọt", 2: "ngọt vừa", 3: "ngọt" },
    fat: { 1: "ít béo", 2: "béo vừa", 3: "nhiều béo" },
};
const tasteText = (t) => (t ? Object.keys(TASTE_TEXT).map((k) => TASTE_TEXT[k][t[k]]).filter(Boolean).join(", ") : null);

// ─────────────────────────────────────────────────────────────────────────────
// CÔNG CỤ (function calling) cho Trợ lý AI.
// Gemini chỉ được "đề nghị" gọi hàm; backend tự chạy hàm trên DB thật và trả kết quả.
// Các quy tắc an toàn (dị ứng, quyền xem) nằm TRONG hàm → AI không thể bỏ qua.
// ─────────────────────────────────────────────────────────────────────────────

const TOOL_DECLARATIONS = [
    {
        name: 'search_recipes',
        description:
            'Tìm công thức trong cơ sở dữ liệu của ứng dụng (nguồn DUY NHẤT để gợi ý món). Dùng cho MỌI yêu cầu ' +
            'tìm / gợi ý món, kể cả theo dinh dưỡng. Chỉ điền tham số người dùng thực sự nêu; tham số không nêu thì bỏ trống. ' +
            'Tự động loại món chứa nguyên liệu người dùng dị ứng. Kết quả đã sắp xếp theo sort_by; ' +
            'max_time_relaxed=true nghĩa là không có món đủ nguyên liệu trong thời gian yêu cầu nên đã bỏ giới hạn thời gian (kết quả sắp theo nhanh nhất) — phải nói rõ điều này với người dùng; ' +
            'relaxed_to_any_ingredient=true nghĩa là không có món đủ mọi nguyên liệu nên đã nới thành "có ít nhất một"; ' +
            'ingredients_not_in_database liệt kê nguyên liệu không có trong dữ liệu (nên báo người dùng).',
        parametersJsonSchema: {
            type: 'object',
            properties: {
                keywords: { type: 'string', description: 'Từ khóa trong TÊN món khi người dùng nêu tên/kiểu món cụ thể, vd "canh chua", "phở", "bánh xèo". Không dùng cho nguyên liệu.' },
                ingredients: { type: 'array', items: { type: 'string' }, description: 'Nguyên liệu món PHẢI có, tiếng Việt, đúng như người dùng nói, vd ["gà","sả"], ["thịt bò"]' },
                exclude_ingredients: { type: 'array', items: { type: 'string' }, description: 'Nguyên liệu KHÔNG muốn có ("bỏ hành", "không ăn được tôm"), vd ["hành"]' },
                max_time: { type: 'integer', description: 'Tổng thời gian chuẩn bị + nấu tối đa, đơn vị PHÚT ("nhanh" ≈ 30, "dưới 1 tiếng" = 60)' },
                difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                diet: { type: 'string', enum: ['vegetarian', 'vegan', 'keto', 'pescatarian', 'omnivore'], description: '"vegetarian" = món chay (gồm cả thuần chay)' },
                categories: { type: 'array', items: { type: 'string' }, description: 'Loại món / bữa / cách chế biến, vd ["lẩu"], ["món nướng"], ["món ăn sáng"], ["canh"]' },
                max_calories: { type: 'integer', description: 'Năng lượng tối đa (kcal) theo dữ liệu công thức ("ít calo" ≈ 400)' },
                min_protein: { type: 'number', description: 'Lượng đạm tối thiểu (gram) theo dữ liệu công thức ("nhiều đạm" ≈ 25)' },
                sort_by: { type: 'string', enum: ['popular', 'quickest', 'lowest_calories', 'highest_protein'] },
                limit: { type: 'integer', description: 'Số món tối đa (1-10), mặc định 6' },
            },
        },
    },
    {
        name: 'get_recipe_details',
        description:
            'Lấy chi tiết 1 công thức: nguyên liệu kèm định lượng, các bước (thứ tự, mô tả, số phút), thời gian, ' +
            'khẩu phần gốc, dinh dưỡng, cảnh báo dị ứng. Dùng khi người dùng hỏi sâu về một món cụ thể đã có id ' +
            '(từ kết quả search_recipes hoặc ngữ cảnh). Không cần gọi nếu dữ liệu món đã có trong ngữ cảnh.',
        parametersJsonSchema: {
            type: 'object',
            properties: { recipe_id: { type: 'string', description: 'id của món (lấy từ kết quả search_recipes hoặc ngữ cảnh)' } },
            required: ['recipe_id'],
        },
    },
    {
        name: 'find_substitutes',
        description:
            'Tra nguyên liệu thay thế trong cơ sở dữ liệu và danh sách nguyên liệu người dùng dị ứng ' +
            '(không được gợi ý những nguyên liệu này).',
        parametersJsonSchema: {
            type: 'object',
            properties: { ingredient: { type: 'string', description: 'Tên nguyên liệu cần thay, vd "nước mắm"' } },
            required: ['ingredient'],
        },
    },
    {
        name: 'get_user_context',
        description:
            'Lấy hồ sơ ẩm thực của người dùng: chế độ ăn, khẩu vị, danh mục yêu thích, dị ứng, ' +
            'món đã lưu, món xem/nấu gần đây. Dùng khi cần gợi ý cá nhân hóa ("tối nay ăn gì?").',
        parametersJsonSchema: { type: 'object', properties: {} },
    },
];

const totalMinutes = (r) => (Number(r.prep_time_minutes) || 0) + (Number(r.cook_time_minutes) || 0);

// Bản rút gọn gửi cho AI (ít token), bản đầy đủ giữ lại để hiện thẻ món trên app
const toCompact = (r) => ({
    id: r.id,
    name: r.name,
    category: r.category_name || null,
    // Tóm tắt ngắn để trợ lý giới thiệu món đúng đặc điểm (không bịa)
    summary: r.description ? String(r.description).slice(0, 140) : null,
    // Vị ước tính từ định lượng công thức (để trả lời "món này có cay / mặn không")
    taste: tasteText(r.taste),
    total_minutes: totalMinutes(r) || null,
    difficulty: r.difficulty,
    diet_type: r.diet_type,
    servings: r.servings,
    calories: r.calories,
    protein_g: r.protein_grams !== null && r.protein_grams !== undefined ? Number(r.protein_grams) : null,
    carbs_g: r.carbs_grams !== null && r.carbs_grams !== undefined ? Number(r.carbs_grams) : null,
    fat_g: r.fat_grams !== null && r.fat_grams !== undefined ? Number(r.fat_grams) : null,
});

/** Nguyên liệu dị ứng của user (lẻ + theo nhóm) → [{id, name}] — services/allergyService.js */
function getUserAllergies(userId) {
    return getUserAllergenIngredients(userId);
}

/**
 * Chi tiết món (chỉ món công khai đã xuất bản, hoặc món của chính người dùng).
 * Trả về null nếu không tìm thấy / không có quyền xem.
 */
async function loadRecipeDetails(recipeId, userId) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(recipeId || ''));
    if (!isUUID) return null;

    const [r, allergies] = await Promise.all([
        recipe.findOne({
            where: { id: recipeId },
            attributes: [
                'id', 'name', 'description', 'servings', 'difficulty', 'diet_type', 'status', 'visibility',
                'owner_user_id', 'prep_time_minutes', 'cook_time_minutes',
                'calories', 'protein_grams', 'carbs_grams', 'fat_grams',
            ],
            include: [
                {
                    model: recipe_ingredient, as: 'recipe_ingredients', separate: true,
                    attributes: ['recipe_id', 'ingredient_id', 'quantity', 'unit', 'group_name', 'is_optional', 'note'],
                    include: [{ model: ingredient, as: 'ingredient', attributes: ['id', 'name'] }],
                },
                {
                    model: step, as: 'steps', separate: true, order: [['step_order', 'ASC']],
                    attributes: ['recipe_id', 'step_order', 'description', 'duration_seconds'],
                },
            ],
        }),
        getUserAllergies(userId),
    ]);
    if (!r) return null;

    const isPublic = r.status === 'published' && r.visibility === 'public';
    const isOwner = userId && String(r.owner_user_id) === String(userId);
    if (!isPublic && !isOwner) return null;

    const allergyIds = new Set(allergies.map((a) => String(a.id)));
    const ingredients = (r.recipe_ingredients || []).map((ri) => ({
        name: ri.ingredient?.name || 'Nguyên liệu',
        quantity: ri.quantity !== null && ri.quantity !== undefined ? Number(ri.quantity) : null,
        unit: ri.unit || null,
        group: ri.group_name || null,
        optional: Boolean(ri.is_optional),
        note: ri.note || null,
    }));
    const matchedAllergies = (r.recipe_ingredients || [])
        .filter((ri) => allergyIds.has(String(ri.ingredient_id)))
        .map((ri) => ri.ingredient?.name)
        .filter(Boolean);

    return {
        id: r.id,
        name: r.name,
        description: r.description || null,
        servings: r.servings,
        difficulty: r.difficulty,
        diet_type: r.diet_type,
        prep_minutes: r.prep_time_minutes,
        cook_minutes: r.cook_time_minutes,
        nutrition: {
            calories: r.calories,
            protein_g: r.protein_grams !== null ? Number(r.protein_grams) : null,
            carbs_g: r.carbs_grams !== null ? Number(r.carbs_grams) : null,
            fat_g: r.fat_grams !== null ? Number(r.fat_grams) : null,
        },
        ingredients,
        steps: (r.steps || []).map((s) => ({
            order: s.step_order,
            text: s.description,
            minutes: s.duration_seconds ? Math.round(s.duration_seconds / 60) : null,
        })),
        allergy_warning: [...new Set(matchedAllergies)],
    };
}

async function findSubstitutes(ingredientName, userId) {
    const term = String(ingredientName || '').trim().slice(0, 60);
    const [found, allergies] = await Promise.all([
        term
            ? ingredient.findOne({
                where: { name: { [Op.iLike]: `%${escapeLike(term)}%` } },
                attributes: ['id', 'name'],
                raw: true,
            })
            : null,
        getUserAllergies(userId),
    ]);

    let dbSubstitutes = [];
    if (found) {
        const [rows] = await sequelize.query(`
            SELECT i.name, s.ratio FROM ingredient_substitute s
            JOIN ingredient i ON i.id = s.substitute_ingredient_id
            WHERE s.ingredient_id = :id
        `, { replacements: { id: found.id } });
        dbSubstitutes = rows.map((x) => ({ name: x.name, ratio: x.ratio !== null ? Number(x.ratio) : null }));
    }
    const allergyNames = allergies.map((a) => a.name);

    return {
        ingredient: found ? found.name : term,
        db_substitutes: dbSubstitutes.filter((s) => !allergyNames.includes(s.name)),
        must_avoid_allergens: allergyNames,
        note: dbSubstitutes.length === 0
            ? 'Cơ sở dữ liệu chưa có gợi ý thay thế cho nguyên liệu này. Có thể gợi ý theo kiến thức nấu ăn phổ biến, ghi rõ là "tham khảo", và tuyệt đối không gợi ý nguyên liệu trong must_avoid_allergens.'
            : null,
    };
}

async function getUserContext(userId, user) {
    if (!userId) return { logged_in: false };

    const q = (sql) => sequelize.query(sql, { replacements: { userId } }).then(([rows]) => rows);
    const [allergies, favorites, saved, recent] = await Promise.all([
        getUserAllergies(userId),
        q(`SELECT c.name FROM user_favorite_category f JOIN category c ON c.id = f.category_id WHERE f.user_id = :userId LIMIT 10`),
        q(`SELECT r.name FROM saved_recipe s JOIN recipe r ON r.id = s.recipe_id
           WHERE s.user_id = :userId AND r.deleted_at IS NULL ORDER BY s.created_at DESC LIMIT 10`),
        q(`SELECT DISTINCT ON (h.recipe_id, h.action) h.action, r.name, h.created_at
           FROM user_activity_history h JOIN recipe r ON r.id = h.recipe_id
           WHERE h.user_id = :userId AND h.action IN ('view', 'cook_completed') AND r.deleted_at IS NULL
           ORDER BY h.recipe_id, h.action, h.created_at DESC`),
    ]);
    const byRecent = (action) => recent
        .filter((x) => x.action === action)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map((x) => x.name);

    return {
        logged_in: true,
        // Khẩu vị đã chọn ("Không ăn cay", "Ăn nhạt"...) — kết quả search_recipes KHÔNG tự lọc theo khẩu vị
        taste_preferences: describeTastePreferences(user?.taste_preferences),
        name: user?.name || null,
        preferred_diet_type: user?.preferred_diet_type || null,
        preferred_tastes: user?.preferred_tastes || null,
        favorite_categories: favorites.map((x) => x.name),
        allergies: allergies.map((a) => a.name),
        saved_recipes: saved.map((x) => x.name),
        recently_viewed: byRecent('view'),
        recently_cooked: byRecent('cook_completed'),
    };
}

/**
 * Chạy 1 công cụ theo tên. Kết quả tìm món được ghi vào `collected` để hiển thị thẻ món trên app.
 */
async function executeTool(name, args, { userId, user, collected }) {
    switch (name) {
        case 'search_recipes': {
            const result = await searchRecipesSafe({ ...args, limit: Math.min(parseInt(args?.limit, 10) || 6, 10) }, userId);
            result.recipes.forEach((r) => collected.set(String(r.id), r));
            return {
                count: result.recipes.length,
                relaxed_to_any_ingredient: result.relaxed,
                max_time_relaxed: result.relaxed_time,
                ingredients_not_in_database: result.unmatched_ingredients,
                recipes: result.recipes.map(toCompact),
            };
        }
        case 'get_recipe_details': {
            const details = await loadRecipeDetails(args?.recipe_id, userId);
            return details || { error: 'Không tìm thấy công thức hoặc không có quyền xem.' };
        }
        case 'find_substitutes':
            return findSubstitutes(args?.ingredient, userId);
        case 'get_user_context':
            return getUserContext(userId, user);
        default:
            return { error: `Công cụ không tồn tại: ${name}` };
    }
}

module.exports = {
    TOOL_DECLARATIONS,
    executeTool,
    loadRecipeDetails,
    findSubstitutes,
    getUserContext,
    getUserAllergies,
};
