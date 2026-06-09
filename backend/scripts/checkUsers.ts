import { pool } from '../src/utils/db';

async function checkUsers() {
  try {
    const columns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
      LIMIT 20
    `);

    console.log('users表前20个字段:');
    columns.rows.forEach((r: any) => console.log(`  - ${r.column_name}`));

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
