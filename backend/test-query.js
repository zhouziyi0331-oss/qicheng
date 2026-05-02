const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'qicheng',
  user: 'postgres',
  password: 'postgres'
});

async function test() {
  try {
    const userId = '99999999-9999-9999-9999-999999999999';

    console.log('Test 1: Query task_assignments');
    const result1 = await pool.query(
      `SELECT task_id FROM task_assignments WHERE student_id = $1`,
      [userId]
    );
    console.log('Result 1:', result1.rows);

    const excludeIds = result1.rows.map(r => r.task_id);
    console.log('excludeIds:', excludeIds);
    console.log('excludeIds.length:', excludeIds.length);

    const targetLevel = 0;

    if (excludeIds.length > 0) {
      console.log('\nTest 2: Query with excludeIds');
      const result2 = await pool.query(
        `SELECT t.id, t.title FROM tasks t
         WHERE t.status = 'active'
           AND t.level_required <= $1
           AND t.deleted_at IS NULL
           AND t.id != ALL($2::uuid[])
         ORDER BY t.created_at DESC LIMIT 20`,
        [targetLevel, excludeIds]
      );
      console.log('Result 2:', result2.rows.length, 'tasks');
    } else {
      console.log('\nTest 2: Query without excludeIds');
      const result2 = await pool.query(
        `SELECT t.id, t.title FROM tasks t
         WHERE t.status = 'active'
           AND t.level_required <= $1
           AND t.deleted_at IS NULL
         ORDER BY t.created_at DESC LIMIT 20`,
        [targetLevel]
      );
      console.log('Result 2:', result2.rows.length, 'tasks');
    }

    console.log('\nAll tests passed!');
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await pool.end();
  }
}

test();
