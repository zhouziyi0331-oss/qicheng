const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng'
});

async function createAdminUser() {
  try {
    // 生成密码哈希
    const password = 'admin123456';
    const passwordHash = await bcrypt.hash(password, 10);

    // 获取超级管理员角色ID
    const roleResult = await pool.query(
      "SELECT id FROM admin_roles WHERE role_code = 'super_admin'"
    );

    if (roleResult.rows.length === 0) {
      console.error('错误：未找到超级管理员角色');
      process.exit(1);
    }

    const roleId = roleResult.rows[0].id;

    // 创建管理员账号
    const result = await pool.query(
      `INSERT INTO admin_users (username, password_hash, real_name, role_id, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (username) DO UPDATE
       SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING id, username, real_name, status`,
      ['admin', passwordHash, '系统管理员', roleId, 'active']
    );

    console.log('✓ 管理员账号创建/更新成功！');
    console.log('\n账号信息:');
    console.log('  用户名: admin');
    console.log('  密码: admin123456');
    console.log('  角色: 超级管理员');
    console.log('  状态: active');
    console.log('\n⚠️  请在生产环境中立即修改默认密码！');

    await pool.end();
  } catch (error) {
    console.error('创建失败:', error.message);
    process.exit(1);
  }
}

createAdminUser();
