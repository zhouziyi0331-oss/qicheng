import { pool } from '../src/utils/db';

async function checkCompanyFields() {
  try {
    const r = await pool.query(`
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
    r.rows.forEach((row: any) => console.log(`  ${row.column_name}: ${row.data_type}`));

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCompanyFields();
