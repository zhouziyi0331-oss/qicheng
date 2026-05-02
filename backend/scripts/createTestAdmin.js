const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTestAdmin() {
  try {
    console.log('开始创建测试管理员账号...');

    // 1. 生成密码哈希
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('密码哈希生成成功');

    // 2. 检查管理员是否已存在
    const existingAdmin = await pool.query(
      'SELECT id FROM admin_users WHERE username = $1',
      ['admin']
    );

    if (existingAdmin.rows.length > 0) {
      const adminId = existingAdmin.rows[0].id;
      console.log('管理员已存在，ID:', adminId);

      // 更新密码和状态
      await pool.query(
        'UPDATE admin_users SET password_hash = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [hashedPassword, 'active', adminId]
      );
      console.log('密码已更新');
    } else {
      // 3. 先检查是否有super_admin角色
      const roleResult = await pool.query(
        "SELECT id FROM admin_roles WHERE role_name = 'super_admin'"
      );

      let roleId;
      if (roleResult.rows.length > 0) {
        roleId = roleResult.rows[0].id;
        console.log('找到super_admin角色，ID:', roleId);
      } else {
        // 创建super_admin角色
        const newRole = await pool.query(`
          INSERT INTO admin_roles (id, role_name, description, permissions, created_at)
          VALUES (gen_random_uuid(), 'super_admin', '超级管理员', '["all"]', NOW())
          RETURNING id
        `);
        roleId = newRole.rows[0].id;
        console.log('创建super_admin角色，ID:', roleId);
      }

      // 4. 创建管理员账号
      const adminResult = await pool.query(`
        INSERT INTO admin_users (
          id, username, password_hash, real_name, email, phone,
          role_id, status, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
        )
        RETURNING id
      `, [
        'admin',
        hashedPassword,
        '系统管理员',
        'admin@qicheng.com',
        '13800000000',
        roleId,
        'active'
      ]);

      console.log('管理员创建成功，ID:', adminResult.rows[0].id);
    }

    console.log('\n✅ 测试管理员账号创建/更新成功！');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('角色: super_admin');

  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

createTestAdmin();
