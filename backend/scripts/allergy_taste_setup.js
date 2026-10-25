/**
 * Cài đặt lọc dị ứng theo nhóm + hồ sơ khẩu vị. Chạy được nhiều lần (idempotent).
 *
 *   node scripts/allergy_taste_setup.js migrate        Tạo bảng ingredient_group, ingredient_group_member,
 *                                                     user_allergy_group, recipe_taste_profile + cột user.taste_preferences
 *   node scripts/allergy_taste_setup.js seed           Nạp/đồng bộ nhóm dị ứng từ src/data/allergenGroups.js
 *   node scripts/allergy_taste_setup.js migrate-users  Chuyển lựa chọn dị ứng CŨ (1 nguyên liệu đại diện/nhóm) → cả nhóm
 *   node scripts/allergy_taste_setup.js taste          Tính hồ sơ vị cho mọi món
 *   node scripts/allergy_taste_setup.js all            Chạy lần lượt cả 4 bước
 */
require('dotenv').config({ quiet: true });
const { sequelize } = require('../src/models');
const ALLERGEN_GROUPS = require('../src/data/allergenGroups');
const { recomputeTasteProfiles } = require('../src/services/tasteProfileService');

async function migrate() {
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS ingredient_group (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            slug varchar(60) NOT NULL UNIQUE,
            name varchar(120) NOT NULL,
            icon varchar(16),
            sort_order integer NOT NULL DEFAULT 0,
            created_at timestamptz NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS ingredient_group_member (
            group_id uuid NOT NULL REFERENCES ingredient_group(id) ON DELETE CASCADE,
            ingredient_id uuid NOT NULL REFERENCES ingredient(id) ON DELETE CASCADE,
            PRIMARY KEY (group_id, ingredient_id)
        );
        CREATE INDEX IF NOT EXISTS idx_ingredient_group_member_ingredient ON ingredient_group_member(ingredient_id);
        CREATE TABLE IF NOT EXISTS user_allergy_group (
            user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
            group_id uuid NOT NULL REFERENCES ingredient_group(id) ON DELETE CASCADE,
            created_at timestamptz NOT NULL DEFAULT NOW(),
            PRIMARY KEY (user_id, group_id)
        );
        CREATE TABLE IF NOT EXISTS recipe_taste_profile (
            recipe_id uuid PRIMARY KEY REFERENCES recipe(id) ON DELETE CASCADE,
            sodium_mg numeric(9,1),
            sugar_g numeric(7,1),
            spicy_score numeric(6,2),
            has_chili boolean NOT NULL DEFAULT false,
            sour_score numeric(6,2),
            fat_g numeric(7,1),
            salty_level smallint,
            sweet_level smallint,
            spicy_level smallint,
            fat_level smallint,
            sour_level smallint,
            computed_at timestamptz NOT NULL DEFAULT NOW()
        );
        ALTER TABLE "user" ADD COLUMN IF NOT EXISTS taste_preferences jsonb;
    `);
    console.log('✅ migrate: đã tạo bảng / cột (nếu chưa có)');
}

async function seed() {
    const [ingredients] = await sequelize.query('SELECT id, name FROM ingredient');
    const byName = new Map(ingredients.map((i) => [i.name.trim().toLowerCase(), i.id]));
    let missingTotal = 0;

    for (const [index, group] of ALLERGEN_GROUPS.entries()) {
        const [[row]] = await sequelize.query(`
            INSERT INTO ingredient_group (slug, name, icon, sort_order)
            VALUES (:slug, :name, :icon, :sort)
            ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order
            RETURNING id
        `, { replacements: { slug: group.slug, name: group.name, icon: group.icon, sort: index } });

        const ids = [];
        const missing = [];
        for (const name of group.members) {
            const id = byName.get(name.trim().toLowerCase());
            if (id) ids.push(id); else missing.push(name);
        }
        missingTotal += missing.length;

        // Đồng bộ đúng theo file dữ liệu: thêm thành viên mới, gỡ thành viên đã bị bỏ khỏi danh sách
        await sequelize.query('DELETE FROM ingredient_group_member WHERE group_id = :gid AND NOT (ingredient_id = ANY(:ids::uuid[]))',
            { replacements: { gid: row.id, ids: `{${ids.join(',')}}` } });
        if (ids.length > 0) {
            await sequelize.query(`
                INSERT INTO ingredient_group_member (group_id, ingredient_id)
                SELECT :gid, unnest(:ids::uuid[]) ON CONFLICT DO NOTHING
            `, { replacements: { gid: row.id, ids: `{${ids.join(',')}}` } });
        }
        console.log(`${group.icon} ${group.name.padEnd(32)} ${String(ids.length).padStart(3)} nguyên liệu${missing.length ? `  ⚠️ không có trong kho: ${missing.join(', ')}` : ''}`);
    }
    console.log(missingTotal ? `⚠️ seed: ${missingTotal} tên không khớp kho nguyên liệu (kiểm tra chính tả)` : '✅ seed: mọi tên đều khớp kho nguyên liệu');
}

// Lựa chọn cũ: mỗi nhóm chỉ lưu 1 nguyên liệu đại diện → nâng thành cả nhóm chứa nguyên liệu đó
async function migrateUsers() {
    const [result] = await sequelize.query(`
        INSERT INTO user_allergy_group (user_id, group_id)
        SELECT DISTINCT ua.user_id, m.group_id
        FROM user_allergy ua JOIN ingredient_group_member m ON m.ingredient_id = ua.ingredient_id
        ON CONFLICT DO NOTHING
        RETURNING user_id, group_id
    `);
    console.log(`✅ migrate-users: thêm ${result.length} lựa chọn nhóm từ dữ liệu dị ứng cũ`);
}

async function taste() {
    const n = await recomputeTasteProfiles(null);
    const [[stats]] = await sequelize.query(`
        SELECT COUNT(*)::int total,
               COUNT(*) FILTER (WHERE spicy_level = 0)::int khong_cay,
               COUNT(*) FILTER (WHERE salty_level = 3)::int dam,
               COUNT(*) FILTER (WHERE sweet_level = 3)::int ngot,
               COUNT(*) FILTER (WHERE fat_level = 3)::int nhieu_beo
        FROM recipe_taste_profile`);
    console.log(`✅ taste: tính ${n} món · không cay ${stats.khong_cay} · đậm/mặn ${stats.dam} · ngọt ${stats.ngot} · nhiều béo ${stats.nhieu_beo}`);
}

(async () => {
    const cmd = process.argv[2] || 'all';
    const steps = { migrate, seed, 'migrate-users': migrateUsers, taste };
    try {
        if (cmd === 'all') {
            for (const fn of Object.values(steps)) await fn();
        } else if (steps[cmd]) {
            await steps[cmd]();
        } else {
            console.log('Lệnh không hợp lệ. Dùng: migrate | seed | migrate-users | taste | all');
        }
    } catch (e) {
        console.error('❌', e.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
})();
