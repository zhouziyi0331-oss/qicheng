/**
 * 获取真实的学生ID用于测试
 */

const { pool } = require('./src/utils/db');

async function getRealStudentId() {
  try {
    const result = await pool.query(
      `SELECT id, username, role FROM users WHERE role = 'student' LIMIT 1`
    );

    if (result.rows.length > 0) {
      console.log('找到学生用户:');
      console.log(`  ID: ${result.rows[0].id}`);
      console.log(`  用户名: ${result.rows[0].username}`);
      console.log(`  角色: ${result.rows[0].role}`);
      console.log('\n将此ID复制到测试脚本中使用');
    } else {
      console.log('未找到学生用户，创建一个测试用户...');

      const newUser = await pool.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ('test-student', 'test@example.com', 'dummy-hash', 'student')
         RETURNING id, username, role`
      );

      console.log('创建的测试用户:');
      console.log(`  ID: ${newUser.rows[0].id}`);
      console.log(`  用户名: ${newUser.rows[0].username}`);
      console.log(`  角色: ${newUser.rows[0].role}`);
    }
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await pool.end();
  }
}

getRealStudentId();
