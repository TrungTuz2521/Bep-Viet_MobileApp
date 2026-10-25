const {
    sequelize,
    recipe,
    saved_recipe,
    step,
    recipe_ingredient,
    recipe_category,
    category
} = require("../models");
const { Op } = require("sequelize");
const { COUNTER_SET_CLAUSE, getCounterReplacements } = require("../services/systemConfigService");
const { recomputeTasteProfiles } = require("../services/tasteProfileService");
const { TASTE_ATTRIBUTE } = require("../services/tasteFilterService");
const {
    isUUID,
    pickRecipeFields,
    validCategoryIds,
    buildRecipeIngredients,
    buildRecipeSteps
} = require("../services/recipeWriteService");
const { uploadRecipeImage } = require("../services/storageService");

// Tính lại hồ sơ vị ở nền sau khi tạo / sửa món (không chặn response)
const refreshTasteProfile = (recipeId) => {
    recomputeTasteProfiles([recipeId]).catch((e) => console.warn('Không tính được hồ sơ vị:', e.message));
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. SAVED RECIPES (Tab Đã Lưu)
// ─────────────────────────────────────────────────────────────────────────────

exports.getSavedRecipes = async (req, res) => {
    try {
        const userId = req.user.id;
        const saved = await saved_recipe.findAll({
            where: { user_id: userId },
            include: [{
                model: recipe,
                as: 'recipe',
                attributes: [
                    'id', 'name', 'slug', 'image_url', 'difficulty', 'diet_type',
                    'prep_time_minutes', 'cook_time_minutes', 'popularity_score', 'save_count',
                    TASTE_ATTRIBUTE
                ],
                include: [
                    {
                        model: recipe_category,
                        as: 'recipe_categories',
                        attributes: ['category_id'],
                        include: [{ model: category, as: 'category', attributes: ['id', 'name', 'slug'] }]
                    }
                ]
            }],
            order: [['created_at', 'DESC']]
        });

        const formatted = saved.map(item => {
            const json = item.toJSON();
            if (json.recipe) {
                json.recipe.category = json.recipe.recipe_categories?.[0]?.category || null;
            }
            return json;
        });

        return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        console.error("Get Saved Recipes Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.saveRecipe = async (req, res) => {
    try {
        const { recipe_id } = req.body;
        const userId = req.user.id;

        if (!recipe_id) {
            return res.status(400).json({ success: false, message: "Mã công thức (recipe_id) là bắt buộc." });
        }

        // 1 câu SQL nguyên tử (thay cho 7 round-trip: BEGIN, tìm món, kiểm tra trùng, insert,
        // tăng save_count, COMMIT, tính lại popularity): kiểm tra món tồn tại → thêm bản ghi lưu
        // (bỏ qua nếu đã lưu) → tăng save_count + popularity_score chỉ khi thực sự thêm mới.
        const replacements = {
            ...(await getCounterReplacements({ save: 1 })),
            userId,
            recipeId: recipe_id
        };
        const [[result]] = await sequelize.query(`
            WITH target AS (
                SELECT id FROM recipe WHERE id = :recipeId AND deleted_at IS NULL
            ),
            ins AS (
                INSERT INTO saved_recipe (user_id, recipe_id, created_at)
                SELECT :userId, id, NOW() FROM target
                ON CONFLICT DO NOTHING
                RETURNING recipe_id
            ),
            upd AS (
                UPDATE recipe SET ${COUNTER_SET_CLAUSE}
                WHERE id IN (SELECT recipe_id FROM ins)
                RETURNING id
            )
            SELECT (SELECT COUNT(*) FROM target)::int AS found,
                   (SELECT COUNT(*) FROM upd)::int AS inserted
        `, { replacements });

        if (!result.found) {
            return res.status(404).json({ success: false, message: "Công thức không tồn tại." });
        }
        if (!result.inserted) {
            return res.status(409).json({ success: false, message: "Công thức này đã được lưu trước đó." });
        }

        return res.status(200).json({ success: true, message: "Đã lưu công thức vào bộ sưu tập." });
    } catch (error) {
        console.error("Save Recipe Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.unsaveRecipe = async (req, res) => {
    try {
        const { recipe_id } = req.params;
        const userId = req.user.id;

        // 1 câu SQL nguyên tử: xóa bản ghi lưu → giảm save_count (không âm) + cập nhật popularity
        const replacements = {
            ...(await getCounterReplacements({ save: -1 })),
            userId,
            recipeId: recipe_id
        };
        await sequelize.query(`
            WITH del AS (
                DELETE FROM saved_recipe
                WHERE user_id = :userId AND recipe_id = :recipeId
                RETURNING recipe_id
            )
            UPDATE recipe SET ${COUNTER_SET_CLAUSE}
            WHERE id IN (SELECT recipe_id FROM del) AND deleted_at IS NULL
        `, { replacements });

        return res.status(200).json({ success: true, message: "Đã bỏ lưu công thức." });
    } catch (error) {
        console.error("Unsave Recipe Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. MY RECIPES (Tab Của Tôi - CRUD)
// ─────────────────────────────────────────────────────────────────────────────

exports.getMyRecipes = async (req, res) => {
    try {
        const userId = req.user.id;
        const recipes = await recipe.findAll({
            where: { owner_user_id: userId },
            attributes: [
                'id', 'name', 'slug', 'image_url', 'difficulty', 'diet_type',
                'prep_time_minutes', 'cook_time_minutes', 'status', 'visibility',
                'created_at', 'updated_at',
                TASTE_ATTRIBUTE
            ],
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({ success: true, data: recipes });
    } catch (error) {
        console.error("Get My Recipes Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.createMyRecipe = async (req, res) => {
    const userId = req.user.id;
    const fields = pickRecipeFields(req.body || {}, { isCreate: true });
    if (!fields.name) {
        return res.status(400).json({ success: false, message: "Tên món ăn là bắt buộc." });
    }

    const t = await sequelize.transaction();
    try {
        // Slug duy nhất từ tên (bỏ dấu) + thời điểm tạo; không nhận slug từ client
        const cleanName = fields.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80);

        // 1. Tạo recipe (difficulty / diet_type mặc định của hệ thống)
        const newRecipe = await recipe.create({
            difficulty: 'medium',
            diet_type: 'omnivore',
            ...fields,
            slug: `${cleanName || 'mon-an'}-${Date.now()}`,
            owner_user_id: userId,
            status: "published"
        }, { transaction: t });

        // 2. Danh mục
        const categoryIds = await validCategoryIds(req.body.category_ids, t);
        if (categoryIds && categoryIds.length > 0) {
            await recipe_category.bulkCreate(
                categoryIds.map((cId) => ({ recipe_id: newRecipe.id, category_id: cId })),
                { transaction: t, ignoreDuplicates: true }
            );
        }

        // 3. Nguyên liệu (khớp kho không phân biệt hoa/thường)
        const recipeIngredients = await buildRecipeIngredients(newRecipe.id, req.body.ingredients, t);
        if (recipeIngredients.length > 0) {
            await recipe_ingredient.bulkCreate(recipeIngredients, { transaction: t });
        }

        // 4. Các bước nấu
        const recipeSteps = buildRecipeSteps(newRecipe.id, req.body.steps);
        if (recipeSteps.length > 0) {
            await step.bulkCreate(recipeSteps, { transaction: t });
        }

        await t.commit();
        refreshTasteProfile(newRecipe.id);
        return res.status(201).json({
            success: true,
            message: "Tạo công thức thành công.",
            data: newRecipe
        });
    } catch (error) {
        await t.rollback();
        console.error("Create My Recipe Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.updateMyRecipe = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    if (!isUUID(id)) {
        return res.status(404).json({ success: false, message: "Công thức không tồn tại hoặc bạn không có quyền sửa." });
    }
    const body = req.body || {};
    // Chỉ các trường được phép (không cho đổi chủ món, slug, trạng thái, bộ đếm...)
    const fields = pickRecipeFields(body, { isCreate: false });
    if ('name' in fields && !fields.name) {
        return res.status(400).json({ success: false, message: "Tên món ăn là bắt buộc." });
    }

    const t = await sequelize.transaction();
    try {
        const myRecipe = await recipe.findOne({
            where: { id, owner_user_id: userId },
            transaction: t
        });

        if (!myRecipe) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Công thức không tồn tại hoặc bạn không có quyền sửa." });
        }

        // 1. Thông tin cơ bản
        if (Object.keys(fields).length > 0) {
            await myRecipe.update(fields, { transaction: t });
        }

        // 2. Danh mục (chỉ khi client gửi category_ids)
        const categoryIds = await validCategoryIds(body.category_ids, t);
        if (categoryIds) {
            await recipe_category.destroy({ where: { recipe_id: id }, transaction: t });
            if (categoryIds.length > 0) {
                await recipe_category.bulkCreate(
                    categoryIds.map((cId) => ({ recipe_id: id, category_id: cId })),
                    { transaction: t, ignoreDuplicates: true }
                );
            }
        }

        // 3. Nguyên liệu (xóa cũ, ghi mới)
        if (Array.isArray(body.ingredients)) {
            await recipe_ingredient.destroy({ where: { recipe_id: id }, transaction: t });
            const recipeIngredients = await buildRecipeIngredients(id, body.ingredients, t);
            if (recipeIngredients.length > 0) {
                await recipe_ingredient.bulkCreate(recipeIngredients, { transaction: t });
            }
        }

        // 4. Các bước nấu (xóa cũ, ghi mới với step_order 1..n)
        if (Array.isArray(body.steps)) {
            await step.destroy({ where: { recipe_id: id }, transaction: t });
            const recipeSteps = buildRecipeSteps(id, body.steps);
            if (recipeSteps.length > 0) {
                await step.bulkCreate(recipeSteps, { transaction: t });
            }
        }

        await t.commit();
        refreshTasteProfile(id);
        return res.status(200).json({ success: true, message: "Cập nhật công thức thành công." });
    } catch (error) {
        await t.rollback();
        console.error("Update My Recipe Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2b. TẢI ẢNH MÓN ĂN (Supabase Storage)
// ─────────────────────────────────────────────────────────────────────────────

exports.uploadRecipeImage = async (req, res) => {
    try {
        const { base64, mime_type } = req.body || {};
        if (!base64 || typeof base64 !== 'string') {
            return res.status(400).json({ success: false, message: "Thiếu dữ liệu ảnh." });
        }
        const url = await uploadRecipeImage(req.user.id, base64, mime_type);
        return res.status(201).json({ success: true, data: { url } });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }
        console.error("Upload Recipe Image Error:", error);
        return res.status(500).json({ success: false, message: "Không tải được ảnh lên. Vui lòng thử lại." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. SOFT DELETE, RESTORE & TRASH
// ─────────────────────────────────────────────────────────────────────────────

exports.deleteMyRecipe = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const myRecipe = await recipe.findOne({ where: { id, owner_user_id: userId } });
        if (!myRecipe) {
            return res.status(404).json({ success: false, message: "Công thức không tồn tại hoặc bạn không có quyền xóa." });
        }

        // Soft delete tự động cập nhật cột deleted_at
        await myRecipe.destroy();

        return res.status(200).json({
            success: true,
            message: "Đã chuyển công thức vào thùng rác (lưu giữ 30 ngày)."
        });
    } catch (error) {
        console.error("Delete My Recipe Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.restoreMyRecipe = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Dùng paranoid: false để tìm bản ghi đã bị soft delete
        const myRecipe = await recipe.findOne({
            where: { id, owner_user_id: userId },
            paranoid: false
        });

        if (!myRecipe || !myRecipe.deleted_at) {
            return res.status(404).json({ success: false, message: "Không tìm thấy công thức đã xóa trong thùng rác." });
        }

        await myRecipe.restore();

        return res.status(200).json({ success: true, message: "Khôi phục công thức thành công." });
    } catch (error) {
        console.error("Restore My Recipe Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.getTrashRecipes = async (req, res) => {
    try {
        const userId = req.user.id;
        const trashed = await recipe.findAll({
            where: {
                owner_user_id: userId,
                deleted_at: { [Op.ne]: null }
            },
            paranoid: false,
            attributes: [
                'id', 'name', 'slug', 'image_url', 'difficulty',
                'prep_time_minutes', 'cook_time_minutes', 'deleted_at'
            ],
            order: [['deleted_at', 'DESC']]
        });

        return res.status(200).json({ success: true, data: trashed });
    } catch (error) {
        console.error("Get Trash Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
