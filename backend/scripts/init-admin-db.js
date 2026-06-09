const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// 从.env读取配置
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng',
});

async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔍 检查数据库连接...');
    const dbCheck = await client.query('SELECT current_database()');
    console.log('✅ 已连接到数据库:', dbCheck.rows[0].current_database);

    // 检查admin_roles表是否存在
    console.log('\n🔍 检查admin_roles表...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'admin_roles'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  admin_roles表不存在，开始创建...');

      // 读取并执行047_admin_tables.sql
      const sqlPath = path.join(__dirname, '../migrations/047_admin_tables.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');

      await client.query(sql);
      console.log('✅ admin表结构创建成功');
    } else {
      console.log('✅ admin_roles表已存在');
    }

    // 检查admin_users表中是否有账号
    console.log('\n🔍 检查admin_users表...');
    const userCheck = await client.query('SELECT COUNT(*) FROM admin_users');
    console.log(`📊 当前admin_users表中有 ${userCheck.rows[0].count} 个账号`);

    // 检查是否有18502885747这个账号
    const targetUser = await client.query(
      'SELECT * FROM admin_users WHERE username = $1',
      ['18502885747']
    );

    if (targetUser.rows.length === 0) {
      console.log('\n⚠️  账号 18502885747 不存在，开始创建...');

      // 获取super_admin角色ID
      const roleResult = await client.query(
        "SELECT id FROM admin_roles WHERE role_code = 'super_admin' LIMIT 1"
      );

      if (roleResult.rows.length === 0) {
        throw new Error('super_admin角色不存在');
      }

      const roleId = roleResult.rows[0].id;

      // 生成密码hash
      const passwordHash = await bcrypt.hash('chengyanlove', 10);

      // 创建账号
      await client.query(`
        INSERT INTO admin_users (username, password_hash, real_name, phone, role_id, status)
        VALUES ($1, $2, $3, $4, $5, 'active')
      `, ['18502885747', passwordHash, '测试管理员', '18502885747', roleId]);

      console.log('✅ 账号创建成功');
      console.log('   用户名: 18502885747');
      console.log('   密码: chengyanlove');
    } else {
      console.log('✅ 账号 18502885747 已存在');
      console.log('   账号信息:', {
        id: targetUser.rows[0].id,
        username: targetUser.rows[0].username,
        real_name: targetUser.rows[0].real_name,
        status: targetUser.rows[0].status,
      });

      // 更新密码为chengyanlove（以防密码不对）
      console.log('\n🔄 更新密码为 chengyanlove...');
      const passwordHash = await bcrypt.hash('chengyanlove', 10);
      await client.query(
        'UPDATE admin_users SET password_hash = $1 WHERE username = $2',
        [passwordHash, '18502885747']
      );
      console.log('✅ 密码已更新');
    }

    // 验证登录
    console.log('\n🔐 验证登录...');
    const loginTest = await client.query(`
      SELECT au.*, ar.role_name, ar.role_code, ar.permissions
      FROM admin_users au
      LEFT JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.username = $1 AND au.status = 'active'
    `, ['18502885747']);

    if (loginTest.rows.length > 0) {
      const admin = loginTest.rows[0];
      const isValid = await bcrypt.compare('chengyanlove', admin.password_hash);

      if (isValid) {
        console.log('✅ 登录验证成功！');
        console.log('   角色:', admin.role_name, `(${admin.role_code})`);
      } else {
        console.log('❌ 密码验证失败');
      }
    } else {
      console.log('❌ 账号不存在或未激活');
    }

    console.log('\n✅ 数据库初始化完成！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();
