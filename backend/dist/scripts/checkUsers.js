"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/utils/db");
async function checkUsers() {
    try {
        const columns = await db_1.pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
      LIMIT 20
    `);
        console.log('users表前20个字段:');
        columns.rows.forEach((r) => console.log(`  - ${r.column_name}`));
    }
    catch (error) {
        console.error('Error:', error.message);
    }
    finally {
        await db_1.pool.end();
    }
}
checkUsers();
//# sourceMappingURL=checkUsers.js.map