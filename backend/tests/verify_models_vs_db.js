require("dotenv").config();
const { sequelize, ...models } = require("../src/models");

async function verifyModelsVsDatabase() {
    console.log("=== BẮT ĐẦU KIỂM TRA ĐỐI CHIẾU SEQUELIZE MODELS VỚI POSTGRESQL DATABASE ===\n");

    const [dbColumns] = await sequelize.query(`
        SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        ORDER BY table_name, ordinal_position;
    `);

    // Nhóm columns theo table
    const dbTableMap = {};
    for (const row of dbColumns) {
        if (!dbTableMap[row.table_name]) dbTableMap[row.table_name] = {};
        dbTableMap[row.table_name][row.column_name] = row;
    }

    const tableNames = Object.keys(models);
    let totalIssues = 0;

    for (const modelKey of tableNames) {
        const model = models[modelKey];
        const tableName = model.tableName || modelKey;
        const dbTable = dbTableMap[tableName];

        console.log(`📌 Bảng [${tableName}] (Model: ${modelKey}):`);

        if (!dbTable) {
            console.log(`  ❌ THIẾU BẢNG: Bảng '${tableName}' không tồn tại trong DB!`);
            totalIssues++;
            continue;
        }

        const modelAttributes = model.rawAttributes;
        const modelFields = Object.keys(modelAttributes);
        const dbCols = Object.keys(dbTable);

        // Kiểm tra từng trường trong model xem có trong DB không
        for (const field of modelFields) {
            const attr = modelAttributes[field];
            const colName = attr.field || field;
            if (!dbTable[colName]) {
                console.log(`  ❌ Lệch cột: Model có field '${field}' (col: '${colName}'), nhưng DB không có!`);
                totalIssues++;
            }
        }

        // Kiểm tra từng cột trong DB xem model có định nghĩa không
        for (const col of dbCols) {
            const foundInModel = modelFields.some(f => (modelAttributes[f].field || f) === col);
            if (!foundInModel) {
                console.log(`  ⚠️ Thiếu trong Model: DB có cột '${col}' (${dbTable[col].udt_name}), nhưng Model '${modelKey}' chưa khai báo!`);
                totalIssues++;
            }
        }

        console.log(`  ✅ Cột trong DB (${dbCols.length} cột): ${dbCols.join(", ")}`);
    }

    // Kiểm tra các enum trong DB
    const [enums] = await sequelize.query(`
        SELECT t.typname as enum_name, e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        ORDER BY t.typname, e.enumsortorder;
    `);

    const enumMap = {};
    for (const e of enums) {
        if (!enumMap[e.enum_name]) enumMap[e.enum_name] = [];
        enumMap[e.enum_name].push(e.enum_value);
    }

    console.log("\n📌 Danh sách ENUM trong PostgreSQL:");
    for (const name of Object.keys(enumMap)) {
        console.log(`  - ${name}: [${enumMap[name].join(", ")}]`);
    }

    console.log("\n=======================================================");
    if (totalIssues === 0) {
        console.log("🎉 KẾT QUẢ: 100% TẤT CẢ MODEL VÀ DATABASE ĐÃ HOÀN TOÀN KHỚP NHAU!");
    } else {
        console.log(`⚠️ Phát hiện ${totalIssues} điểm lệch cần điều chỉnh.`);
    }
    console.log("=======================================================");
    
    process.exit(totalIssues > 0 ? 1 : 0);
}

verifyModelsVsDatabase().catch(err => {
    console.error("Lỗi khi kiểm tra:", err);
    process.exit(1);
});
