const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// 从环境变量读取数据库配置
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'qicheng',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function initAdminUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 开始初始化管理员账号...\n');

    // 1. 检查 admin_users 表结构
    const tableInfo = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'admin_users'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 admin_users 表结构:');
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    console.log('');

    // 2. 检查是否已存在管理员
    const existingAdmins = await client.query(
      `SELECT username FROM admin_users WHERE username IN ('admin', '18502885747')`
    );
    
    if (existingAdmins.rows.length > 0) {
      console.log('⚠️  已存在管理员账号:');
      existingAdmins.rows.forEach(row => {
        console.log(`  - ${row.username}`);
      });
      console.log('');
    }

    // 3. 检查 admin_roles 表
    const roles = await client.query(`SELECT id, role_code, role_name FROM admin_roles`);
    
    if (roles.rows.length === 0) {
      console.log('❌ admin_roles 表为空，需要先初始化角色数据');
      return;
    }
    
    console.log('✅ admin_roles 表数据:');
    roles.rows.forEach(role => {
      console.log(`  - ${role.role_code}: ${role.role_name} (${role.id})`);
    });
    console.log('');

    // 4. 获取超级管理员角色ID
    const superAdminRole = roles.rows.find(r => r.role_code === 'super_admin');
    
    if (!superAdminRole) {
      console.log('❌ 未找到 super_admin 角色');
      return;
    }

    // 5. 插入或更新管理员账号
    const adminHash = '$2a$10$LTINUwpAKM7XTGljYluf5.f/ii3Gah5LtHCqhhso8WjZPHhINfm2O'; // admin123456
    const chengyanHash = '$2a$10$9YUgpTdhsnVeBa/YRqjbj.pxxfsn0kA2GO8P/GdIISLOHW7tEnb8y'; // chengyanlove

    // 插入 admin 账号
    await client.query(`
      INSERT INTO admin_users (username, password_hash, real_name, role_id, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) 
      DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        updated_at = CURRENT_TIMESTAMP
    `, ['admin', adminHash, '系统管理员', superAdminRole.id, 'active']);
    
    console.log('✅ 创建/更新账号: admin (密码: admin123456)');

    // 插入 18502885747 账号
    await client.query(`
      INSERT INTO admin_users (username, password_hash, real_name, role_id, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) 
      DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        updated_at = CURRENT_TIMESTAMP
    `, ['18502885747', chengyanHash, '测试管理员', superAdminRole.id, 'active']);
    
    console.log('✅ 创建/更新账号: 18502885747 (密码: chengyanlove)');
    console.log('');

    // 6. 验证创建结果
    const result = await client.query(`
      SELECT 
        au.id,
        au.username,
        au.real_name,
        ar.role_name,
        ar.role_code,
        au.status,
        au.created_at
      FROM admin_users au
      LEFT JOIN admin_roles ar ON au.role_id = ar.id
      WHERE au.username IN ('admin', '18502885747')
      ORDER BY au.username
    `);

    console.log('📊 管理员账号列表:');
    result.rows.forEach(row => {
      console.log(`  - ${row.username} (${row.real_name})`);
      console.log(`    角色: ${row.role_name} (${row.role_code})`);
      console.log(`    状态: ${row.status}`);
      console.log(`    创建时间: ${row.created_at}`);
      console.log('');
    });

    console.log('✅ 管理员账号初始化完成！');
    console.log('');
    console.log('🔐 登录信息:');
    console.log('  账号1: admin / admin123456');
    console.log('  账号2: 18502885747 / chengyanlove');
    console.log('');
    console.log('🌐 登录地址: http://localhost:3001/admin/login');

  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

initAdminUsers();
