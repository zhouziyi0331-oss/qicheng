import { pool } from '../src/utils/db';

async function checkEnum() {
  try {
    // 检查task_status枚举值
    const result = await pool.query(`
      SELECT unnest(enum_range(NULL::task_status))::text as status
    `);

    console.log('task_status枚举值:');
    result.rows.forEach((r: any) => console.log(`  - ${r.status}`));

    // 检查有多少任务
    const tasks = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM tasks
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('\n任务状态分布:');
    tasks.rows.forEach((r: any) => console.log(`  - ${r.status}: ${r.count}`));

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkEnum();
