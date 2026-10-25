const { system_config, recipe, sequelize } = require('../models');

// Bộ nhớ cache tạm thời cho cấu hình hệ thống (TTL 60 giây)
let configCache = {};
let lastFetchedAt = 0;
const CACHE_TTL_MS = 60 * 1000;

/**
 * Lấy cấu hình hệ thống từ bảng system_config (có cache ngắn hạn)
 */
async function getSystemConfigs() {
  const now = Date.now();
  if (now - lastFetchedAt < CACHE_TTL_MS && Object.keys(configCache).length > 0) {
    return configCache;
  }

  try {
    const configs = await system_config.findAll();
    const configMap = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }
    configCache = configMap;
    lastFetchedAt = now;
    return configCache;
  } catch (error) {
    console.warn('Lỗi đọc bảng system_config, sử dụng giá trị mặc định:', error.message);
    return {
      weight_save: '3',
      weight_cook: '5',
      weight_view: '1',
      retention_days: '30',
    };
  }
}

/**
 * Lấy trọng số tính popularity_score
 */
async function getPopularityWeights() {
  const configs = await getSystemConfigs();
  return {
    weight_save: parseFloat(configs.weight_save) || 3,
    weight_cook: parseFloat(configs.weight_cook) || 5,
    weight_view: parseFloat(configs.weight_view) || 1,
  };
}

/**
 * Lấy số ngày lưu trữ soft-delete
 */
async function getRetentionDays() {
  const configs = await getSystemConfigs();
  return parseInt(configs.retention_days, 10) || 30;
}

/**
 * Tính lại và cập nhật popularity_score cho 1 công thức
 * Công thức: popularity_score = save_count * weight_save + cook_count * weight_cook + view_count * weight_view
 * @param {string} recipeId
 * @param {object} [transaction]
 */
async function updateRecipePopularityScore(recipeId, transaction = null) {
  try {
    const weights = await getPopularityWeights();
    const recipeData = await recipe.findByPk(recipeId, {
      attributes: ['id', 'view_count', 'save_count', 'cook_count'],
      transaction,
    });

    if (!recipeData) return null;

    const viewCount = Number(recipeData.view_count) || 0;
    const saveCount = Number(recipeData.save_count) || 0;
    const cookCount = Number(recipeData.cook_count) || 0;

    const newScore = (
      saveCount * weights.weight_save +
      cookCount * weights.weight_cook +
      viewCount * weights.weight_view
    ).toFixed(2);

    await recipe.update(
      { popularity_score: newScore },
      { where: { id: recipeId }, transaction }
    );

    return newScore;
  } catch (error) {
    console.warn(`Lỗi cập nhật popularity_score cho recipe ${recipeId}:`, error.message);
    return null;
  }
}

/**
 * Mệnh đề SET dùng chung: cộng/trừ bộ đếm và tính lại popularity_score trong CÙNG một câu UPDATE
 * (thay cho increment + findByPk + update = 3 round-trip, và an toàn khi nhiều request đồng thời).
 * Cần replacements: :dview, :dsave, :dcook, :ws, :wc, :wv
 */
const COUNTER_SET_CLAUSE = `
  view_count = GREATEST(COALESCE(view_count, 0) + :dview, 0),
  save_count = GREATEST(COALESCE(save_count, 0) + :dsave, 0),
  cook_count = GREATEST(COALESCE(cook_count, 0) + :dcook, 0),
  popularity_score = ROUND((
    GREATEST(COALESCE(save_count, 0) + :dsave, 0) * :ws +
    GREATEST(COALESCE(cook_count, 0) + :dcook, 0) * :wc +
    GREATEST(COALESCE(view_count, 0) + :dview, 0) * :wv
  )::numeric, 2),
  updated_at = NOW()`;

async function getCounterReplacements({ view = 0, save = 0, cook = 0 } = {}) {
  const weights = await getPopularityWeights();
  return {
    dview: view,
    dsave: save,
    dcook: cook,
    ws: weights.weight_save,
    wc: weights.weight_cook,
    wv: weights.weight_view,
  };
}

/**
 * Tăng/giảm bộ đếm của 1 công thức + cập nhật popularity_score trong 1 truy vấn.
 * @returns {Promise<boolean>} true nếu công thức tồn tại (chưa bị xóa mềm)
 */
async function incrementRecipeCounters(recipeId, deltas, transaction = null) {
  const replacements = { ...(await getCounterReplacements(deltas)), id: recipeId };
  const [rows] = await sequelize.query(
    `UPDATE recipe SET ${COUNTER_SET_CLAUSE} WHERE id = :id AND deleted_at IS NULL RETURNING id`,
    { replacements, transaction }
  );
  return rows.length > 0;
}

module.exports = {
  getSystemConfigs,
  getPopularityWeights,
  getRetentionDays,
  updateRecipePopularityScore,
  COUNTER_SET_CLAUSE,
  getCounterReplacements,
  incrementRecipeCounters,
};
