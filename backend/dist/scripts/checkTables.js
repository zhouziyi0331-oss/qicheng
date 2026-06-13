"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/utils/db");
async function checkTables() {
    try {
        const result = await db_1.pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND (tablename LIKE 'student_capabilities%'
           OR tablename LIKE 'task_student_matches%'
           OR tablename LIKE 'task_translations%')
      ORDER BY tablename
    `);
        console.log('相关表:', result.rows.map((r) => r.tablename));
        // Check if student_capabilities exists
        const scExists = result.rows.some((r) => r.tablename === 'student_capabilities');
        console.log('\nstudent_capabilities表存在:', scExists);
        if (scExists) {
            // Check columns in student_capabilities
            const columns = await db_1.pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'student_capabilities'
        ORDER BY ordinal_position
      `);
            console.log('\nstudent_capabilities表结构:');
            columns.rows.forEach((col) => {
                console.log(`  - ${col.column_name}: ${col.data_type}`);
            });
        }
    }
    catch (error) {
        console.error('Error:', error.message);
    }
    finally {
        await db_1.pool.end();
    }
}
checkTables();
//# sourceMappingURL=checkTables.js.map