import { pool } from '../src/utils/db';

async function checkFieldNames() {
  try {
    // 检查tasks表的track相关字段
    const tasksFields = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'tasks'
        AND (column_name LIKE '%track%'
             OR column_name LIKE '%budget%'
             OR column_name LIKE '%level%')
      ORDER BY column_name
    `);

    console.log('\n✓ tasks表字段:');
    tasksFields.rows.forEach((r: any) => console.log(`  ${r.column_name}: ${r.data_type}`));

    // 检查task_assignments表结构
    const assignmentFields = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'task_assignments'
      ORDER BY column_name
    `);

    console.log('\n✓ task_assignments表字段:');
    assignmentFields.rows.forEach((r: any) => console.log(`  ${r.column_name}: ${r.data_type}`));

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkFieldNames();
