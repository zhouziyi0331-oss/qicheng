"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/utils/db");
async function findTaskTables() {
    try {
        const result = await db_1.pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND (table_name LIKE '%task%'
             OR table_name LIKE '%application%'
             OR table_name LIKE '%assignment%'
             OR table_name LIKE '%student%')
      ORDER BY table_name
    `);
        console.log('\n任务/学生相关表:');
        result.rows.forEach((r) => console.log(`  - ${r.table_name}`));
    }
    catch (error) {
        console.error('Error:', error.message);
    }
    finally {
        await db_1.pool.end();
    }
}
findTaskTables();
//# sourceMappingURL=findTaskTables.js.map