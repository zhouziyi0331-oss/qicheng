import { pool } from '../src/utils/db';

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND (tablename LIKE 'student_capabilities%'
           OR tablename LIKE 'task_student_matches%'
           OR tablename LIKE 'task_translations%')
      ORDER BY tablename
    `);

    console.log('相关表:', result.rows.map((r: any) => r.tablename));

    // Check if student_capabilities exists
    const scExists = result.rows.some((r: any) => r.tablename === 'student_capabilities');
    console.log('\nstudent_capabilities表存在:', scExists);

    if (scExists) {
      // Check columns in student_capabilities
      const columns = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'student_capabilities'
        ORDER BY ordinal_position
      `);
      console.log('\nstudent_capabilities表结构:');
      columns.rows.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
