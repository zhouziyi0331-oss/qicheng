"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/utils/db");
async function checkTasksSchema() {
    try {
        const columns = await db_1.pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'tasks'
      AND (column_name LIKE '%skill%' OR column_name LIKE '%require%')
      ORDER BY column_name
    `);
        console.log('tasks表技能/需求相关字段:');
        columns.rows.forEach((r) => console.log(`  - ${r.column_name}: ${r.data_type}`));
    }
    catch (error) {
        console.error('Error:', error.message);
    }
    finally {
        await db_1.pool.end();
    }
}
checkTasksSchema();
//# sourceMappingURL=checkTasksSchema.js.map