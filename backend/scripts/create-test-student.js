const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'qicheng',
  user: 'postgres',
  password: 'postgres'
});

async function createTestStudent() {
  try {
    const phone = '13900000099';
    const password = 'test123456';
    const passwordHash = await bcrypt.hash(password, 10);

    // 检查是否已存在
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);

    if (existing.rows.length > 0) {
      // 更新密码
      await pool.query('UPDATE users SET password_hash = $1 WHERE phone = $2', [passwordHash, phone]);
      console.log(`✅ 更新测试学生账号: ${phone} / ${password}`);
    } else {
      // 创建新学生
      await pool.query(
        `INSERT INTO users (phone, password_hash, nickname, avatar_url, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [phone, passwordHash, '测试学生', 'https://via.placeholder.com/100', 'active']
      );
      console.log(`✅ 创建测试学生账号: ${phone} / ${password}`);
    }

    // 验证登录
    const user = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (user.rows.length > 0) {
      const isValid = await bcrypt.compare(password, user.rows[0].password_hash);
      console.log(`验证密码: ${isValid ? '✅ 成功' : '❌ 失败'}`);
      console.log(`用户信息:`, {
        id: user.rows[0].id,
        phone: user.rows[0].phone,
        nickname: user.rows[0].nickname,
        status: user.rows[0].status
      });
    }

    await pool.end();
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

createTestStudent();
