const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'qicheng',
  user: 'postgres',
  password: 'postgres'
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 开始执行安全合规迁移...\n');

    const sqlPath = path.join(__dirname, '../migrations/security_compliance.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 执行迁移
    await client.query(sql);

    console.log('✅ 迁移执行成功！\n');

    // 验证表是否创建成功
    console.log('📋 验证新创建的表和视图：\n');

    const tables = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('admin_audit_logs', 'user_credentials', 'admin_students_masked', 'admin_companies_masked')
      ORDER BY table_name
    `);

    tables.rows.forEach(row => {
      console.log(`  ✓ ${row.table_type}: ${row.table_name}`);
    });

    // 检查新增的字段
    console.log('\n📋 验证新增的字段：\n');

    const columns = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'company_profiles')
      AND column_name IN ('bio', 'profile_completed', 'university', 'major', 'grade', 'city', 'industry', 'company_size', 'business_license', 'verified')
      ORDER BY table_name, column_name
    `);

    columns.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}.${row.column_name} (${row.data_type})`);
    });

    // 检查审计日志函数
    console.log('\n📋 验证审计日志函数：\n');

    const functions = await client.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = 'log_admin_action'
    `);

    if (functions.rows.length > 0) {
      console.log(`  ✓ FUNCTION: log_admin_action`);
    }

    console.log('\n✅ 安全合规迁移完成！');
    console.log('\n📝 已创建：');
    console.log('  - admin_audit_logs 表（审计日志）');
    console.log('  - user_credentials 表（密码隔离存储）');
    console.log('  - admin_students_masked 视图（学生数据脱敏）');
    console.log('  - admin_companies_masked 视图（企业数据脱敏）');
    console.log('  - log_admin_action 函数（记录审计日志）');
    console.log('  - users 表新增字段：bio, profile_completed, university, major, grade, city');
    console.log('  - company_profiles 表新增字段：industry, company_size, business_license, verified');

  } catch (error) {
    console.error('❌ 迁移失败：', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
