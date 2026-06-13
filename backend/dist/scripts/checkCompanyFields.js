"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/utils/db");
async function checkCompanyFields() {
    try {
        const r = await db_1.pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND (column_name LIKE '%company%'
             OR column_name LIKE '%business%'
             OR column_name LIKE '%enterprise%'
             OR column_name LIKE '%org%')
      ORDER BY column_name
    `);
        console.log('\n✓ users表企业相关字段:');
        r.rows.forEach((row) => console.log(`  ${row.column_name}: ${row.data_type}`));
    }
    catch (error) {
        console.error('Error:', error.message);
    }
    finally {
        await db_1.pool.end();
    }
}
checkCompanyFields();
//# sourceMappingURL=checkCompanyFields.js.map