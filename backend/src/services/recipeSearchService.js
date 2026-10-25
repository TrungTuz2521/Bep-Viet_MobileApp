const { recipe, ingredient, category, sequelize } = require("../models");
const { Op } = require("sequelize");
// Điều kiện dị ứng dùng chung (nguyên liệu lẻ + nhóm dị ứng) — services/allergyService.js
const { allergyExcludeCondition } = require("./allergyService");
const { TASTE_ATTRIBUTE } = require("./tasteFilterService");

// ─────────────────────────────────────────────────────────────────────────────
// Tìm món AN TOÀN dùng chung cho trợ lý AI.
// Mọi truy vấn đều BẮT BUỘC: món đã xuất bản + công khai + (nếu đăng nhập) loại món chứa
// nguyên liệu dị ứng (cả cây nguyên liệu con). Không có đường nào bỏ qua được các điều kiện này.
// ─────────────────────────────────────────────────────────────────────────────

// Các cột trả về cho thẻ món + thông tin dinh dưỡng cho trợ lý
const SEARCH_ATTRIBUTES = [
    'id', 'name', 'slug', 'description', 'image_url', 'difficulty', 'servings', 'diet_type',
    'prep_time_minutes', 'cook_time_minutes', 'popularity_score',
    'calories', 'protein_grams', 'carbs_grams', 'fat_grams',
    TASTE_ATTRIBUTE
];

// "Chay" trong tiếng Việt gồm cả ăn chay có trứng/sữa (vegetarian) và thuần chay (vegan)
const DIET_EXPANSION = {
    vegetarian: ['vegetarian', 'vegan'],
    vegan: ['vegan'],
    keto: ['keto'],
    pescatarian: ['pescatarian'],
    omnivore: ['omnivore'],
};

const SORTS = {
    popular: [['popularity_score', 'DESC'], ['name', 'ASC']],
    quickest: [[sequelize.literal('prep_time_minutes + cook_time_minutes'), 'ASC'], ['popularity_score', 'DESC']],
    lowest_calories: [[sequelize.literal('calories IS NULL'), 'ASC'], ['calories', 'ASC']],
    highest_protein: [[sequelize.literal('protein_grams IS NULL'), 'ASC'], ['protein_grams', 'DESC']],
};

/** Escape ký tự đặc biệt của LIKE/ILIKE (%, _, \) */
function escapeLike(str) {
    return String(str || '').replace(/[%_\\]/g, '\\$&');
}

const cleanTerms = (list) =>
    (Array.isArray(list) ? list : [])
        .map((t) => String(t || '').trim())
        .filter((t) => t.length > 0 && t.length <= 60)
        .slice(0, 8);


/** Điều kiện món có (exists=true) / không có (exists=false) nguyên liệu thuộc cây các id cho trước */
function ingredientTreeCondition(ids, exists) {
    const quoted = ids.map((id) => sequelize.escape(id)).join(',');
    return sequelize.literal(`${exists ? '' : 'NOT '}EXISTS (
        SELECT 1 FROM recipe_ingredient ri
        WHERE ri.recipe_id = "recipe"."id"
        AND ri.ingredient_id IN (
            WITH RECURSIVE ing_tree AS (
                SELECT id FROM ingredient WHERE id IN (${quoted})
                UNION ALL
                SELECT i.id FROM ingredient i INNER JOIN ing_tree t ON i.parent_id = t.id
            )
            SELECT id FROM ing_tree
        )
    )`);
}

/** Điều kiện món thuộc các danh mục (gồm danh mục con) */
function categoryTreeCondition(ids) {
    const quoted = ids.map((id) => sequelize.escape(id)).join(',');
    return sequelize.literal(`EXISTS (
        SELECT 1 FROM recipe_category rc
        WHERE rc.recipe_id = "recipe"."id"
        AND rc.category_id IN (
            WITH RECURSIVE cat_tree AS (
                SELECT id FROM category WHERE id IN (${quoted})
                UNION ALL
                SELECT c.id FROM category c INNER JOIN cat_tree ct ON c.parent_category_id = ct.id
            )
            SELECT id FROM cat_tree
        )
    )`);
}

// Sản phẩm "phái sinh" mang tên nguyên liệu khác: "Trứng gà", "Mắm tôm", "Nấm đùi gà", "Sữa ... không đường".
// Hỏi "gà" không nên khớp các nguyên liệu này (trừ khi người dùng hỏi đúng tên, vd "trứng gà").
const DERIVED_HEAD_WORDS = new Set(['trứng', 'nấm', 'mắm', 'muối', 'bánh', 'sữa', 'nước', 'dầu', 'bột', 'hạt', 'tương']);
// Tiền tố chung chung: "thịt gà" → cũng thử "gà" (DB lưu "Ức gà", "Đùi gà", "Gà ta"...)
const GENERIC_PREFIXES = ['thịt ', 'con ', 'trái ', 'quả ', 'củ ', 'lá '];

const normalizeName = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');

// Các biến thể của 1 từ khóa: "thịt gà" → ["thịt gà", "gà"]
function termVariants(term) {
    const t = normalizeName(term);
    const variants = [t];
    GENERIC_PREFIXES.forEach((p) => {
        if (t.startsWith(p) && t.length > p.length) variants.push(t.slice(p.length));
    });
    return variants;
}

// Khớp theo NGUYÊN TỪ (không khớp chuỗi con) và bỏ qua sản phẩm phái sinh
function ingredientMatches(name, variant) {
    const n = normalizeName(name);
    if (!` ${n} `.includes(` ${variant} `)) return false;
    const head = n.split(' ')[0];
    if (n.startsWith(variant)) return true;
    return !DERIVED_HEAD_WORDS.has(head) && !n.includes('không');
}

/** Tìm id nguyên liệu theo từng từ khóa → [[ids của từ 1], [ids của từ 2], ...] */
async function findIngredientIdsPerTerm(terms) {
    if (terms.length === 0) return [];
    const variantsPerTerm = terms.map(termVariants);
    const allVariants = [...new Set(variantsPerTerm.flat())];
    const rows = await ingredient.findAll({
        where: { [Op.or]: allVariants.map((v) => ({ name: { [Op.iLike]: `%${escapeLike(v)}%` } })) },
        attributes: ['id', 'name'],
        raw: true,
    });
    return variantsPerTerm.map((variants) => {
        // Ưu tiên biến thể cụ thể nhất có kết quả ("thịt bò" có trong DB thì không mở rộng sang mọi loại "bò")
        for (const v of variants) {
            const ids = rows.filter((r) => ingredientMatches(r.name, v)).map((r) => r.id);
            if (ids.length > 0) return ids;
        }
        return [];
    });
}

async function findCategoryIds(terms) {
    if (terms.length === 0) return [];
    const rows = await category.findAll({
        where: { [Op.or]: terms.map((t) => ({ name: { [Op.iLike]: `%${escapeLike(t)}%` } })) },
        attributes: ['id'],
        raw: true,
    });
    return rows.map((r) => r.id);
}

/**
 * Tìm món theo bộ lọc. Trả về { recipes, total_found, relaxed, unmatched_ingredients }
 * @param {object} filters keywords, ingredients[], exclude_ingredients[], max_time, difficulty,
 *                         diet, categories[], max_calories, min_protein, sort_by, limit
 * @param {string|null} userId Người dùng đăng nhập (để lọc dị ứng)
 */
async function searchRecipesSafe(filters = {}, userId = null) {
    const ingredientTerms = cleanTerms(filters.ingredients);
    const excludeTerms = cleanTerms(filters.exclude_ingredients);
    const categoryTerms = cleanTerms(filters.categories);
    const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 6, 1), 20);

    // Tra id nguyên liệu / danh mục SONG SONG (mỗi truy vấn tới DB ở xa ~100ms)
    const [includeIdsPerTerm, excludeIdsPerTerm, categoryIds] = await Promise.all([
        findIngredientIdsPerTerm(ingredientTerms),
        findIngredientIdsPerTerm(excludeTerms),
        findCategoryIds(categoryTerms),
    ]);

    const base = [];
    // Điều kiện an toàn bắt buộc
    const where = { status: 'published', visibility: 'public' };
    if (userId) base.push(allergyExcludeCondition(userId));

    if (filters.keywords && String(filters.keywords).trim()) {
        const kw = escapeLike(String(filters.keywords).trim().slice(0, 80));
        base.push({
            [Op.or]: [
                { name: { [Op.iLike]: `%${kw}%` } },
                { description: { [Op.iLike]: `%${kw}%` } },
            ],
        });
    }
    if (['easy', 'medium', 'hard'].includes(filters.difficulty)) where.difficulty = filters.difficulty;
    if (DIET_EXPANSION[filters.diet]) where.diet_type = { [Op.in]: DIET_EXPANSION[filters.diet] };

    // Điều kiện thời gian để riêng: khi không có món phù hợp sẽ nới thời gian TRƯỚC khi nới nguyên liệu
    const maxTime = parseInt(filters.max_time, 10);
    const timeConditions = maxTime > 0
        ? [sequelize.where(sequelize.literal('prep_time_minutes + cook_time_minutes'), '<=', maxTime)]
        : [];
    const maxCalories = parseInt(filters.max_calories, 10);
    if (maxCalories > 0) base.push({ calories: { [Op.lte]: maxCalories } });
    const minProtein = parseFloat(filters.min_protein);
    if (minProtein > 0) base.push({ protein_grams: { [Op.gte]: minProtein } });

    const excludeIds = excludeIdsPerTerm.flat();
    if (excludeIds.length > 0) base.push(ingredientTreeCondition(excludeIds, false));
    if (categoryIds.length > 0) base.push(categoryTreeCondition(categoryIds));

    const order = SORTS[filters.sort_by] || SORTS.popular;
    const matchedIngredientGroups = includeIdsPerTerm.filter((ids) => ids.length > 0);
    const unmatchedIngredients = ingredientTerms.filter((_, i) => includeIdsPerTerm[i].length === 0);

    const run = (ingredientConditions, withTime = true) =>
        recipe.findAll({
            where: { ...where, [Op.and]: [...base, ...(withTime ? timeConditions : []), ...ingredientConditions] },
            // Đã bỏ giới hạn thời gian → ưu tiên món nhanh nhất để vẫn sát yêu cầu "nấu nhanh"
            order: withTime ? order : SORTS.quickest,
            limit,
            attributes: SEARCH_ATTRIBUTES,
            raw: true,
        });

    // Thứ tự nới lỏng khi không có món phù hợp (nguyên liệu là thứ người dùng thật sự có → giữ lâu nhất):
    //  1. Đủ mọi điều kiện
    //  2. Giữ ĐỦ nguyên liệu, bỏ giới hạn thời gian (vd: không có món gà + sả dưới 30 phút → món gà + sả nhanh nhất)
    //  3. Có ÍT NHẤT MỘT nguyên liệu, giữ giới hạn thời gian
    const allIngredients = matchedIngredientGroups.map((ids) => ingredientTreeCondition(ids, true));
    let relaxed = false;
    let relaxedTime = false;
    let rows = await run(allIngredients);
    if (rows.length === 0 && timeConditions.length > 0 && matchedIngredientGroups.length > 0) {
        rows = await run(allIngredients, false);
        relaxedTime = rows.length > 0;
    }
    if (rows.length === 0 && matchedIngredientGroups.length > 1) {
        relaxed = true;
        rows = await run([ingredientTreeCondition(matchedIngredientGroups.flat(), true)]);
    }

    // Gắn danh mục chính (danh mục được gán đầu tiên) để trợ lý biết món thuộc loại gì
    if (rows.length > 0) {
        const [cats] = await sequelize.query(`
            SELECT DISTINCT ON (rc.recipe_id) rc.recipe_id, c.name
            FROM recipe_category rc JOIN category c ON c.id = rc.category_id
            WHERE rc.recipe_id IN (:ids)
            ORDER BY rc.recipe_id, rc.ctid
        `, { replacements: { ids: rows.map((r) => r.id) } });
        const catByRecipe = new Map(cats.map((c) => [String(c.recipe_id), c.name]));
        rows.forEach((r) => { r.category_name = catByRecipe.get(String(r.id)) || null; });
    }

    return { recipes: rows, relaxed, relaxed_time: relaxedTime, unmatched_ingredients: unmatchedIngredients };
}

module.exports = {
    searchRecipesSafe,
    escapeLike,
    DIET_EXPANSION,
};
