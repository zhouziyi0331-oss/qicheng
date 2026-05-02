const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'qicheng',
  user: 'postgres',
  password: 'postgres'
});

async function createTestUser() {
  try {
    const password = 'test123456';
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建测试学生
    const student = await pool.query(`
      INSERT INTO users (id, role, phone, password_hash, nickname, is_active)
      VALUES ($1, 'student', '13900000099', $2, '测试学生', true)
      ON CONFLICT (phone) DO UPDATE SET password_hash = $2
      RETURNING id, phone, role, nickname
    `, ['99999999-9999-9999-9999-999999999999', passwordHash]);

    console.log('✅ 测试学生创建成功:');
    console.log('   手机号: 13900000099');
    console.log('   密码: test123456');
    console.log('   角色: student');
    console.log('   ID:', student.rows[0].id);

  } catch (err) {
    console.error('❌ 错误:', err.message);
  } finally {
    await pool.end();
  }
}

createTestUser();
