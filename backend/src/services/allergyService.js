const { sequelize } = require("../models");

/**
 * NGUỒN DUY NHẤT cho "nguyên liệu người dùng phải tránh" — mọi bộ lọc dị ứng (Khám phá, Tìm kiếm,
 * Trợ lý AI, cảnh báo ở trang chi tiết) đều dùng hàm này để không có chỗ nào bị sót.
 * Gồm: nguyên liệu chọn lẻ (user_allergy) ∪ thành viên các NHÓM đã chọn (user_allergy_group)
 *      + toàn bộ nguyên liệu con theo cây parent_id.
 * Lọc mọi nguyên liệu (kể cả is_optional) để đảm bảo an toàn cao nhất.
 */
function allergenIngredientIdsSql(userId) {
    const u = sequelize.escape(userId);
    return `
        WITH RECURSIVE allergy_seed AS (
            SELECT ua.ingredient_id FROM user_allergy ua WHERE ua.user_id = ${u}
            UNION
            SELECT m.ingredient_id
            FROM user_allergy_group ug
            JOIN ingredient_group_member m ON m.group_id = ug.group_id
            WHERE ug.user_id = ${u}
        ),
        allergy_tree AS (
            SELECT ingredient_id FROM allergy_seed
            UNION
            SELECT i.id FROM ingredient i INNER JOIN allergy_tree t ON i.parent_id = t.ingredient_id
        )
        SELECT ingredient_id FROM allergy_tree`;
}

/** Điều kiện Sequelize: loại món có chứa nguyên liệu dị ứng của user (bảng chính phải có alias "recipe") */
function allergyExcludeCondition(userId) {
    if (!userId) return null;
    return sequelize.literal(`NOT EXISTS (
        SELECT 1 FROM recipe_ingredient ri
        WHERE ri.recipe_id = "recipe"."id"
        AND ri.ingredient_id IN (${allergenIngredientIdsSql(userId)})
    )`);
}

/** Danh sách nguyên liệu dị ứng của user → [{ id, name }] */
async function getUserAllergenIngredients(userId) {
    if (!userId) return [];
    const [rows] = await sequelize.query(`
        SELECT i.id, i.name FROM ingredient i
        WHERE i.id IN (${allergenIngredientIdsSql(userId)})
    `);
    return rows;
}

module.exports = { allergenIngredientIdsSql, allergyExcludeCondition, getUserAllergenIngredients };
