const { category, sequelize } = require("../models");
const { escapeLike } = require("../services/recipeSearchService");
const { normalizeTastePreferences } = require("../services/tasteFilterService");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DIET_TYPES = ['omnivore', 'vegetarian', 'vegan', 'keto', 'pescatarian'];

/** Chỉ giữ UUID hợp lệ CÓ THẬT trong bảng (tránh lỗi khóa ngoại / id rác từ client) */
async function existingIds(table, ids, transaction) {
    const clean = [...new Set((Array.isArray(ids) ? ids : []).map(String).filter((id) => UUID_RE.test(id)))];
    if (clean.length === 0) return [];
    const [rows] = await sequelize.query(`SELECT id FROM ${table} WHERE id = ANY(:ids::uuid[])`, {
        replacements: { ids: `{${clean.join(',')}}` },
        transaction,
    });
    return rows.map((r) => r.id);
}

// GET /user/preferences
exports.getPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const q = (sql) => sequelize.query(sql, { replacements: { userId } }).then(([rows]) => rows);
        const [groups, singles, favorites] = await Promise.all([
            q('SELECT group_id FROM user_allergy_group WHERE user_id = :userId'),
            q(`SELECT i.id, i.name FROM user_allergy ua JOIN ingredient i ON i.id = ua.ingredient_id
               WHERE ua.user_id = :userId ORDER BY i.name`),
            q(`SELECT c.id, c.name FROM user_favorite_category f JOIN category c ON c.id = f.category_id
               WHERE f.user_id = :userId ORDER BY c.name`),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                preferred_diet_type: req.user.preferred_diet_type,
                preferred_tastes: req.user.preferred_tastes,
                taste_preferences: normalizeTastePreferences(req.user.taste_preferences),
                // Dị ứng theo NHÓM (Hải sản, Trứng...) + nguyên liệu chọn LẺ từ kho
                allergy_group_ids: groups.map((g) => g.group_id),
                allergy_ingredient_ids: singles.map((i) => i.id),
                allergies: singles,
                favorite_category_ids: favorites.map((c) => c.id),
                favorite_categories: favorites,
            },
        });
    } catch (error) {
        console.error("Get Preferences Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// PUT /user/preferences — trường nào không gửi thì giữ nguyên
exports.updatePreferences = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.user.id;
        const {
            preferred_diet_type,
            preferred_tastes,
            taste_preferences,
            allergy_group_ids,
            allergy_ingredient_ids,
            favorite_category_ids,
        } = req.body;

        // 1. Chế độ ăn + khẩu vị
        const updates = {};
        if (DIET_TYPES.includes(preferred_diet_type)) updates.preferred_diet_type = preferred_diet_type;
        if (typeof preferred_tastes === 'string') updates.preferred_tastes = preferred_tastes.slice(0, 255);
        if (taste_preferences !== undefined) updates.taste_preferences = normalizeTastePreferences(taste_preferences);
        if (Object.keys(updates).length > 0) {
            await req.user.update(updates, { transaction: t });
        }

        // 2. Dị ứng theo nhóm (xóa cũ, thêm mới)
        if (Array.isArray(allergy_group_ids)) {
            const ids = await existingIds('ingredient_group', allergy_group_ids, t);
            await sequelize.query('DELETE FROM user_allergy_group WHERE user_id = :userId', { replacements: { userId }, transaction: t });
            if (ids.length > 0) {
                await sequelize.query(`INSERT INTO user_allergy_group (user_id, group_id) SELECT :userId, unnest(:ids::uuid[])`,
                    { replacements: { userId, ids: `{${ids.join(',')}}` }, transaction: t });
            }
        }

        // 3. Dị ứng từng nguyên liệu lẻ (chọn từ kho nguyên liệu)
        if (Array.isArray(allergy_ingredient_ids)) {
            const ids = await existingIds('ingredient', allergy_ingredient_ids, t);
            await sequelize.query('DELETE FROM user_allergy WHERE user_id = :userId', { replacements: { userId }, transaction: t });
            if (ids.length > 0) {
                await sequelize.query(`INSERT INTO user_allergy (user_id, ingredient_id, created_at) SELECT :userId, unnest(:ids::uuid[]), NOW()`,
                    { replacements: { userId, ids: `{${ids.join(',')}}` }, transaction: t });
            }
        }

        // 4. Danh mục yêu thích
        if (Array.isArray(favorite_category_ids)) {
            const ids = await existingIds('category', favorite_category_ids, t);
            await sequelize.query('DELETE FROM user_favorite_category WHERE user_id = :userId', { replacements: { userId }, transaction: t });
            if (ids.length > 0) {
                await sequelize.query(`INSERT INTO user_favorite_category (user_id, category_id) SELECT :userId, unnest(:ids::uuid[])`,
                    { replacements: { userId, ids: `{${ids.join(',')}}` }, transaction: t });
            }
        }

        await t.commit();
        return res.status(200).json({ success: true, message: "Preferences updated successfully" });
    } catch (error) {
        await t.rollback();
        console.error("Update Preferences Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// GET /user/allergy-options — Các NHÓM dị ứng lấy từ DB (kèm danh sách nguyên liệu trong nhóm)
exports.getAllergyOptions = async (req, res) => {
    try {
        const [groups] = await sequelize.query(`
            SELECT g.id, g.slug, g.name, g.icon,
                   COUNT(i.id)::int AS ingredient_count,
                   COALESCE(json_agg(i.name ORDER BY i.name) FILTER (WHERE i.id IS NOT NULL), '[]') AS ingredients
            FROM ingredient_group g
            LEFT JOIN ingredient_group_member m ON m.group_id = g.id
            LEFT JOIN ingredient i ON i.id = m.ingredient_id
            GROUP BY g.id
            ORDER BY g.sort_order, g.name
        `);
        return res.status(200).json({
            success: true,
            data: groups.map((g) => ({
                id: g.id,
                slug: g.slug,
                label: g.name,
                icon: g.icon,
                ingredient_count: g.ingredient_count,
                ingredients: g.ingredients,
            })),
        });
    } catch (error) {
        console.error("Get Allergy Options Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// GET /user/ingredients?search=... — Tìm nguyên liệu trong kho để chọn dị ứng lẻ
// Không nhập từ khóa → trả các nguyên liệu dùng nhiều nhất
exports.searchIngredients = async (req, res) => {
    try {
        const term = String(req.query.search || '').trim().slice(0, 50);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
        let rows;
        if (term) {
            [rows] = await sequelize.query(`
                SELECT id, name FROM ingredient
                WHERE name ILIKE :like
                ORDER BY (name ILIKE :prefix) DESC, length(name), name
                LIMIT :limit
            `, { replacements: { like: `%${escapeLike(term)}%`, prefix: `${escapeLike(term)}%`, limit } });
        } else {
            [rows] = await sequelize.query(`
                SELECT i.id, i.name FROM ingredient i
                JOIN recipe_ingredient ri ON ri.ingredient_id = i.id
                GROUP BY i.id ORDER BY COUNT(*) DESC, i.name LIMIT :limit
            `, { replacements: { limit } });
        }
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Search Ingredients Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// GET /user/category-options - Trả về danh sách categories cho màn sở thích
exports.getCategoryOptions = async (req, res) => {
    try {
        const categories = await category.findAll({
            attributes: ['id', 'name', 'slug'],
            order: [['name', 'ASC']]
        });

        // Lọc distinct theo name
        const seen = new Set();
        const uniqueCategories = categories.filter(cat => {
            if (seen.has(cat.name)) return false;
            seen.add(cat.name);
            return true;
        });

        return res.status(200).json({ success: true, data: uniqueCategories });
    } catch (error) {
        console.error("Get Category Options Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

