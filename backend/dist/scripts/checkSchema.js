"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/utils/db");
async function checkSchema() {
    try {
        // 检查tasks表是否有requirement_vector字段
        console.log('检查tasks表结构...');
        const tasksColumns = await db_1.pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      AND column_name IN ('requirement_vector', 'combined_embedding', 'title_embedding', 'description_embedding')
      ORDER BY column_name
    `);
        console.log('tasks表向量字段:');
        tasksColumns.rows.forEach((col) => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
        // 检查student_capabilities表是否有profile_vector字段
        console.log('\n检查student_capabilities表结构...');
        const studentColumns = await db_1.pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'student_capabilities'
      AND column_name IN ('profile_vector', 'combined_vector', 'skill_vector')
      ORDER BY column_name
    `);
        console.log('student_capabilities表向量字段:');
        studentColumns.rows.forEach((col) => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
        // 检查是否需要添加requirement_vector字段
        if (!tasksColumns.rows.some((r) => r.column_name === 'requirement_vector')) {
            console.log('\n⚠️  tasks表缺少requirement_vector字段，需要添加');
        }
        // 检查是否需要添加profile_vector字段
        if (!studentColumns.rows.some((r) => r.column_name === 'profile_vector')) {
            console.log('\n⚠️  student_capabilities表缺少profile_vector字段，需要添加');
        }
    }
    catch (error) {
        console.error('Error:', error.message);
    }
    finally {
        await db_1.pool.end();
    }
}
checkSchema();
//# sourceMappingURL=checkSchema.js.map