const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'qicheng',
  user: 'postgres',
  password: 'postgres'
});

async function createProfile() {
  try {
    // 创建学生档案
    await pool.query(`
      INSERT INTO student_profiles (
        user_id, level_a, level_b, track, opc_label,
        created_at, updated_at
      ) VALUES (
        '99999999-9999-9999-9999-999999999999',
        0, 0, 'B', '探索整合者',
        NOW(), NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        level_a = EXCLUDED.level_a,
        level_b = EXCLUDED.level_b,
        track = EXCLUDED.track,
        opc_label = EXCLUDED.opc_label,
        updated_at = NOW()
    `);

    console.log('✓ 学生档案已创建');

    // 验证
    const result = await pool.query(
      'SELECT * FROM student_profiles WHERE user_id = $1',
      ['99999999-9999-9999-9999-999999999999']
    );
    console.log('档案信息:', result.rows[0]);

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await pool.end();
  }
}

createProfile();
