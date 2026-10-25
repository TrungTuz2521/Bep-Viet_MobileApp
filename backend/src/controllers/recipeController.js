const {
    sequelize,
    recipe,
    category,
    ingredient,
    recipe_ingredient,
    step,
    user_allergy,
    user_activity_history,
    recipe_category
} = require("../models");
const { Op } = require("sequelize");
const { incrementRecipeCounters } = require("../services/systemConfigService");
const { allergyExcludeCondition, getUserAllergenIngredients } = require("../services/allergyService");
const { TASTE_ATTRIBUTE, tasteFilterConditions, tasteBoostOrder } = require("../services/tasteFilterService");

// Cột trả về cho API DANH SÁCH: chỉ những gì thẻ món hiển thị.
// Bỏ description / dinh dưỡng / bộ đếm / timestamps → payload 500 món giảm ~70% (chi tiết vẫn trả đủ).
const LIST_ATTRIBUTES = [
    'id', 'name', 'slug', 'image_url', 'difficulty', 'servings',
    'popularity_score', 'status', 'visibility', 'diet_type',
    'prep_time_minutes', 'cook_time_minutes',
    // Mức vị (cay/mặn/ngọt/béo) để app hiện nhãn trên thẻ món
    TASTE_ATTRIBUTE
];

/**
 * Ghi nhận 1 lượt xem: tăng view_count + popularity_score (1 câu UPDATE) và lưu lịch sử xem,
 * chạy song song. Dùng ở nền — không để người dùng phải chờ.
 */
async function trackRecipeView(recipeId, userId) {
    const results = await Promise.allSettled([
        incrementRecipeCounters(recipeId, { view: 1 }),
        user_activity_history.create({
            user_id: userId || null,
            recipe_id: recipeId,
            action: 'view'
        })
    ]);
    results.forEach((r) => {
        if (r.status === 'rejected') console.warn("Could not track recipe view:", r.reason?.message);
    });
}

/**
 * Escape các ký tự đặc biệt của LIKE / ILIKE (%, _) để tránh lỗi logic và injection
 */
function escapeLike(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[%_\\]/g, '\\$&');
}

/**
 * Tạo điều kiện loại trừ dị ứng theo CÂY NGUYÊN LIỆU CHA - CON (Recursive CTE)
 * Quy tắc: Nếu User dị ứng nguyên liệu cha (vd "Hải sản"), loại cả các món chứa nguyên liệu con (vd "Tôm", "Cua").
 * Mặc định lọc TẤT CẢ nguyên liệu (cả is_optional = true hoặc false) để đảm bảo an toàn thực phẩm cao nhất.
 */
function buildAllergyExcludeCondition(userId) {
    // Gồm nguyên liệu chọn lẻ + mọi thành viên các nhóm dị ứng đã chọn (xem services/allergyService.js)
    return allergyExcludeCondition(userId);
}

/**
 * Tạo điều kiện lọc danh mục theo CÂY DANH MỤC CHA - CON (Recursive CTE)
 * Hỗ trợ nhận slug hoặc ID (chuỗi đơn lẻ hoặc mảng / phân cách dấu phẩy).
 * Khi chọn danh mục cha, tự động mở rộng bao gồm tất cả các danh mục con.
 */
function buildCategoryCondition(categoryInput) {
    if (!categoryInput) return null;
    const rawList = Array.isArray(categoryInput) ? categoryInput : String(categoryInput).split(',');
    const catList = rawList.map(c => String(c).trim()).filter(Boolean);
    if (catList.length === 0) return null;

    const escapedKeys = catList.map(k => sequelize.escape(k)).join(',');
    return sequelize.literal(`EXISTS (
        SELECT 1 FROM recipe_category rc
        WHERE rc.recipe_id = "recipe"."id"
        AND rc.category_id IN (
            WITH RECURSIVE cat_tree AS (
                SELECT id FROM category
                WHERE (id::text IN (${escapedKeys}) OR slug IN (${escapedKeys}))
                UNION ALL
                SELECT c.id FROM category c
                INNER JOIN cat_tree ct ON c.parent_category_id = ct.id
            )
            SELECT id FROM cat_tree
        )
    )`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/recipes & GET /api/recipes/search (Danh sách món ăn & Tìm kiếm)
// ─────────────────────────────────────────────────────────────────────────────
exports.getRecipes = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const {
            query,
            category: categoryParam,
            category_ids,
            difficulty,
            diet_type,
            max_time,
            ingredient_ids,
            sort_by = 'popularity_score',
            order = 'DESC',
            page = 1,
            limit = 20
        } = req.query;

        // Base where: Chỉ lấy món đã xuất bản, công khai và chưa bị xóa (paranoid: true)
        const where = {
            status: 'published',
            visibility: 'public'
        };

        const andConditions = [];

        // 1. Lọc theo dị ứng (Hard filter cho User đã đăng nhập, Guest hiển thị tất cả)
        if (userId) {
            const allergyCondition = buildAllergyExcludeCondition(userId);
            if (allergyCondition) {
                andConditions.push(allergyCondition);
            }
        }

        // 2. Lọc theo từ khóa tìm kiếm (name và description, escape LIKE)
        if (query && query.trim()) {
            const cleanQuery = escapeLike(query.trim());
            andConditions.push({
                [Op.or]: [
                    { name: { [Op.iLike]: `%${cleanQuery}%` } },
                    { description: { [Op.iLike]: `%${cleanQuery}%` } }
                ]
            });
        }

        // 3. Lọc theo danh mục (Cây đệ quy cha-con, hỗ trợ param category hoặc category_ids)
        const targetCategoryInput = categoryParam || category_ids;
        if (targetCategoryInput) {
            const catCondition = buildCategoryCondition(targetCategoryInput);
            if (catCondition) {
                andConditions.push(catCondition);
            }
        }

        // 4. Lọc theo độ khó (easy, medium, hard)
        if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
            where.difficulty = difficulty;
        }

        // 5. Lọc theo chế độ ăn (diet_type)
        if (diet_type && ['omnivore', 'vegetarian', 'vegan', 'keto', 'pescatarian'].includes(diet_type)) {
            where.diet_type = diet_type;
        }

        // 6. Lọc theo thời gian nấu tối đa (prep_time_minutes + cook_time_minutes <= max_time)
        const maxTimeNum = parseInt(max_time, 10);
        if (!Number.isNaN(maxTimeNum) && maxTimeNum > 0) {
            andConditions.push(
                sequelize.where(
                    sequelize.literal('prep_time_minutes + cook_time_minutes'),
                    '<=',
                    maxTimeNum
                )
            );
        }

        // 7. Lọc theo mảng ID nguyên liệu chứa trong món
        if (ingredient_ids) {
            const rawIngs = Array.isArray(ingredient_ids) ? ingredient_ids : String(ingredient_ids).split(',');
            const cleanIngs = rawIngs.map(id => String(id).trim()).filter(Boolean);
            if (cleanIngs.length > 0) {
                const quotedIngs = cleanIngs.map(id => sequelize.escape(id)).join(',');
                andConditions.push(
                    sequelize.literal(`EXISTS (
                        SELECT 1 FROM recipe_ingredient ri
                        WHERE ri.recipe_id = "recipe"."id"
                        AND ri.ingredient_id IN (${quotedIngs})
                    )`)
                );
            }
        }

        // Khẩu vị "tránh" (Không ăn cay, Ăn nhạt, Ít ngọt, Ít dầu mỡ) → lọc cứng; ?taste_filter=off để tạm tắt
        const tastePrefs = req.user ? req.user.taste_preferences : null;
        const useTasteFilter = tastePrefs && req.query.taste_filter !== 'off';
        if (useTasteFilter) {
            andConditions.push(...tasteFilterConditions(tastePrefs));
        }

        if (andConditions.length > 0) {
            where[Op.and] = andConditions;
        }

        // Sắp xếp an toàn (mặc định theo yêu cầu: popularity_score DESC, name ASC)
        const cleanOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        let sortOrder = [['popularity_score', 'DESC'], ['name', 'ASC']];

        switch (sort_by) {
            case 'created_at':
                sortOrder = [['created_at', cleanOrder]];
                break;
            case 'name':
                sortOrder = [['name', cleanOrder]];
                break;
            case 'time':
            case 'cook_time':
                sortOrder = [[sequelize.literal('prep_time_minutes + cook_time_minutes'), cleanOrder]];
                break;
            case 'calories':
                sortOrder = [['calories', cleanOrder]];
                break;
            case 'popularity_score':
            default:
                sortOrder = [['popularity_score', cleanOrder], ['name', 'ASC']];
                // Khẩu vị "thích" (Cay nhẹ, Thích cay, Đậm đà, Thích ngọt) → chỉ ưu tiên lên đầu, không ẩn món khác
                if (useTasteFilter) {
                    const boost = tasteBoostOrder(tastePrefs);
                    if (boost) sortOrder.unshift(boost);
                }
                break;
        }

        // Phân trang (mặc định lấy 500 món để hiển thị toàn bộ kho công thức lên trang chủ)
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 500, 1), 1000);
        const offset = (pageNum - 1) * limitNum;

        const { rows, count } = await recipe.findAndCountAll({
            where,
            order: sortOrder,
            limit: limitNum,
            offset,
            distinct: true,
            attributes: LIST_ATTRIBUTES,
            include: [
                {
                    model: recipe_category,
                    as: 'recipe_categories',
                    attributes: ['category_id'],
                    include: [
                        { model: category, as: 'category', attributes: ['id', 'name', 'slug'] }
                    ]
                }
            ]
        });

        // Format danh mục thân thiện
        const formattedRows = rows.map(r => {
            const item = r.toJSON();
            item.category = item.recipe_categories?.[0]?.category || null;
            return item;
        });

        return res.status(200).json({
            success: true,
            data: formattedRows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: count,
                total_pages: Math.ceil(count / limitNum)
            }
        });
    } catch (error) {
        console.error("Get Recipes Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Giữ searchRecipes alias tương thích ngược hoàn toàn
exports.searchRecipes = exports.getRecipes;

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/recipes/discover (Trang chủ Khám Phá)
// ─────────────────────────────────────────────────────────────────────────────
exports.getDiscover = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;

        // Base where: Lấy món hợp lệ (deleted_at IS NULL được xử lý bởi paranoid: true)
        const baseWhere = {
            status: 'published',
            visibility: 'public'
        };

        const andConditions = [];
        if (userId) {
            const allergyCondition = buildAllergyExcludeCondition(userId);
            if (allergyCondition) {
                andConditions.push(allergyCondition);
            }
            andConditions.push(...tasteFilterConditions(req.user.taste_preferences));
        }
        if (andConditions.length > 0) {
            baseWhere[Op.and] = andConditions;
        }

        // 1. Toàn bộ danh sách món ăn trang chủ theo đúng thứ tự: popularity_score DESC, name ASC
        const allHomeRecipes = await recipe.findAll({
            where: baseWhere,
            order: [['popularity_score', 'DESC'], ['name', 'ASC']],
            limit: 500,
            attributes: LIST_ATTRIBUTES,
            include: [
                {
                    model: recipe_category,
                    as: 'recipe_categories',
                    attributes: ['category_id'],
                    include: [
                        { model: category, as: 'category', attributes: ['id', 'name', 'slug'] }
                    ]
                }
            ]
        });

        const formattedAll = allHomeRecipes.map(r => {
            const item = r.toJSON();
            item.category = item.recipe_categories?.[0]?.category || null;
            return item;
        });

        // 2. Món hot (theo popularity_score)
        const popularRecipes = formattedAll.slice(0, 20);

        // 3. Món nấu nhanh (tổng thời gian chuẩn bị + nấu <= 30 phút)
        const quickRecipes = formattedAll
            .filter(r => ((r.prep_time_minutes || 0) + (r.cook_time_minutes || 0)) <= 30)
            .slice(0, 20);

        const data = {
            all_recipes: formattedAll,
            popular: popularRecipes,
            quick_meals: quickRecipes
        };

        // 4. Gợi ý riêng cho User đã đăng nhập (theo preferred_diet_type)
        if (userId) {
            const userDiet = req.user.preferred_diet_type || 'omnivore';
            const recommended = formattedAll.filter(r => r.diet_type === userDiet).slice(0, 20);
            data.recommended = recommended.length >= 3 ? recommended : popularRecipes;
        }

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Get Discover Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /api/recipes/categories (Danh sách Danh Mục)
// ─────────────────────────────────────────────────────────────────────────────
exports.getCategories = async (req, res) => {
    try {
        // recipe_count: số món công khai thuộc danh mục (gồm cả danh mục con, giống bộ lọc danh mục)
        // → frontend ẩn được danh mục rỗng
        const recipeCount = sequelize.literal(`(
            WITH RECURSIVE cat_tree AS (
                SELECT "category"."id" AS id
                UNION
                SELECT c.id FROM category c INNER JOIN cat_tree t ON c.parent_category_id = t.id
            )
            SELECT COUNT(DISTINCT rc.recipe_id)::int FROM recipe_category rc
            INNER JOIN cat_tree t ON t.id = rc.category_id
            INNER JOIN recipe r ON r.id = rc.recipe_id
            WHERE r.status = 'published' AND r.visibility = 'public' AND r.deleted_at IS NULL
        )`);
        const categories = await category.findAll({
            attributes: ['id', 'name', 'slug', 'parent_category_id', [recipeCount, 'recipe_count']],
            order: [['name', 'ASC']]
        });
        return res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.error("Get Categories Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * Lấy toàn bộ cây nguyên liệu dị ứng của user → Map(ingredient_id → tên)
 */
async function fetchUserAllergyMap(userId) {
    const allergyRows = await getUserAllergenIngredients(userId);
    const allergyMap = new Map();
    for (const row of allergyRows) {
        allergyMap.set(String(row.id), row.name);
    }
    return allergyMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /api/recipes/:slug (Chi tiết công thức)
// ─────────────────────────────────────────────────────────────────────────────
exports.getRecipeDetails = async (req, res) => {
    try {
        const rawSlug = req.params.slug || '';
        const cleanSlug = decodeURIComponent(rawSlug).trim();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);
        const whereClause = isUUID ? { [Op.or]: [{ id: cleanSlug }, { slug: cleanSlug }] } : { slug: cleanSlug };

        // Truy vấn cây dị ứng không phụ thuộc vào món → chạy SONG SONG với truy vấn chi tiết
        const allergyPromise = req.user ? fetchUserAllergyMap(req.user.id) : Promise.resolve(null);
        // Tránh unhandled rejection nếu trả về sớm (404/403); lỗi thật vẫn được bắt khi await bên dưới
        allergyPromise.catch(() => {});

        const recipeDetails = await recipe.findOne({
            where: whereClause,
            include: [
                // separate: true → mỗi quan hệ 1-nhiều là 1 truy vấn riêng (chạy song song) thay vì
                // JOIN chung sinh tích Descartes nguyên liệu × bước × danh mục (đo: ~3-6s → ~0.2s)
                {
                    model: recipe_ingredient,
                    as: 'recipe_ingredients',
                    separate: true,
                    // Giữ thứ tự chèn dữ liệu như trước (bảng không có cột thứ tự/created_at)
                    order: [[sequelize.literal('"recipe_ingredient"."ctid"'), 'ASC']],
                    attributes: ['id', 'recipe_id', 'ingredient_id', 'quantity', ['quantity', 'amount'], 'unit', 'group_name', 'is_optional', 'note'],
                    include: [{ model: ingredient, as: 'ingredient', attributes: ['id', 'name', 'parent_id', 'default_unit'] }]
                },
                {
                    model: step,
                    as: 'steps',
                    separate: true,
                    order: [['step_order', 'ASC']],
                    attributes: [
                        'recipe_id',
                        'id',
                        'step_order',
                        ['step_order', 'step_number'],
                        'description',
                        ['description', 'instruction'],
                        'duration_seconds',
                        ['duration_seconds', 'timer_seconds'],
                        'image_url',
                        ['image_url', 'media_url']
                    ]
                },
                {
                    model: recipe_category,
                    as: 'recipe_categories',
                    separate: true,
                    // Danh mục đầu tiên = danh mục chính (json.category) → giữ thứ tự chèn như trước
                    order: [[sequelize.literal('"recipe_category"."ctid"'), 'ASC']],
                    include: [{ model: category, as: 'category', attributes: ['id', 'name', 'slug'] }]
                }
            ]
        });

        if (!recipeDetails) {
            return res.status(404).json({ success: false, message: "Công thức không tồn tại." });
        }

        // Kiểm tra quyền xem món (Guest chỉ xem được món published + public; món private/draft chỉ owner hoặc admin được xem)
        const isOwner = req.user && String(req.user.id) === String(recipeDetails.owner_user_id);
        const isAdmin = req.user && req.user.role === 'admin';
        const isPublicPublished = recipeDetails.status === 'published' && recipeDetails.visibility === 'public';

        if (!isPublicPublished && !isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền xem công thức này (công thức ở chế độ riêng tư hoặc chưa xuất bản)."
            });
        }

        // Ghi nhận lượt xem ở NỀN (không chặn response).
        // Client gửi header X-Skip-View-Tracking: 1 khi tải trước / chế độ nấu, và tự gọi
        // POST /recipes/:id/view khi người dùng thật sự mở trang → không đếm trùng.
        if (req.get('X-Skip-View-Tracking') !== '1') {
            trackRecipeView(recipeDetails.id, req.user ? req.user.id : null);
        }

        const json = recipeDetails.toJSON();
        json.category = json.recipe_categories?.[0]?.category || null;
        json.recipe_ingredients = json.recipe_ingredients || [];
        json.ingredients = json.recipe_ingredients;
        json.steps = json.steps || [];

        // Kiểm tra cảnh báo dị ứng nếu User đã đăng nhập
        json.allergy_warning = false;
        json.matched_allergies = [];

        if (req.user) {
            try {
                const allergyMap = await allergyPromise;

                // So khớp với nguyên liệu của món
                const matched = [];
                for (const ri of json.recipe_ingredients) {
                    const ingId = String(ri.ingredient_id || ri.ingredient?.id);
                    if (allergyMap.has(ingId)) {
                        matched.push(ri.ingredient?.name || allergyMap.get(ingId));
                    }
                }

                if (matched.length > 0) {
                    json.allergy_warning = true;
                    json.matched_allergies = [...new Set(matched)];
                }
            } catch (allergyErr) {
                console.warn("Allergy check in details error:", allergyErr.message);
            }
        }

        return res.status(200).json({ success: true, data: json });
    } catch (error) {
        console.error("Get Details Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. POST /api/recipes/:id/finish-cooking (Hoàn tất nấu ăn)
// ─────────────────────────────────────────────────────────────────────────────
exports.finishCooking = async (req, res) => {
    try {
        const { id } = req.params;

        // Tăng cook_count + cập nhật popularity_score trong 1 câu UPDATE (đồng thời kiểm tra tồn tại)
        const found = await incrementRecipeCounters(id, { cook: 1 });
        if (!found) {
            return res.status(404).json({ success: false, message: "Công thức không tồn tại." });
        }

        // Ghi nhận lịch sử với đúng enum chuẩn PostgreSQL: 'cook_completed'
        await user_activity_history.create({
            user_id: req.user.id,
            recipe_id: id,
            action: 'cook_completed'
        });

        return res.status(200).json({
            success: true,
            message: "Hoàn tất nấu ăn và ghi nhận lịch sử thành công."
        });
    } catch (error) {
        console.error("Finish Cooking Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. POST /api/recipes/:id/view (Ghi nhận lượt xem — tách khỏi GET chi tiết)
// ─────────────────────────────────────────────────────────────────────────────
exports.trackView = async (req, res) => {
    const { id } = req.params;
    // Trả về ngay, ghi nhận ở nền (lượt xem không cần client chờ)
    res.status(204).end();
    trackRecipeView(id, req.user ? req.user.id : null);
};
