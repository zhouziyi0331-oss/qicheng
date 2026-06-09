import { pool } from '../src/utils/db';

async function findTaskTables() {
  try {
    const result = await pool.query(`
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
    result.rows.forEach((r: any) => console.log(`  - ${r.table_name}`));

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

findTaskTables();
