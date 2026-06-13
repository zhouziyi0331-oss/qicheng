"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/utils/db");
async function checkEnum() {
    try {
        // 检查task_status枚举值
        const result = await db_1.pool.query(`
      SELECT unnest(enum_range(NULL::task_status))::text as status
    `);
        console.log('task_status枚举值:');
        result.rows.forEach((r) => console.log(`  - ${r.status}`));
        // 检查有多少任务
        const tasks = await db_1.pool.query(`
      SELECT status, COUNT(*) as count
      FROM tasks
      GROUP BY status
      ORDER BY count DESC
    `);
        console.log('\n任务状态分布:');
        tasks.rows.forEach((r) => console.log(`  - ${r.status}: ${r.count}`));
    }
    catch (error) {
        console.error('Error:', error.message);
    }
    finally {
        await db_1.pool.end();
    }
}
checkEnum();
//# sourceMappingURL=checkEnum.js.map