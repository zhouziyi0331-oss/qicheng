// 数据库部署脚本 - 使用Node.js执行migrations
// 文件位置: backend/scripts/deploy-migrations.js

const fs = require('fs');
const path = require('path');

// 从.env读取数据库配置
require('dotenv').config();

// 使用pg库连接数据库
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function executeMigration(migrationFile) {
  const filePath = path.join(__dirname, '..', 'migrations', migrationFile);

  console.log(`\n📄 执行migration: ${migrationFile}`);
  console.log(`文件路径: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    return false;
  }

  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    console.log(`⏳ 开始执行...`);
    await pool.query(sql);
    console.log(`✅ ${migrationFile} 执行成功！`);
    return true;
  } catch (error) {
    console.error(`❌ ${migrationFile} 执行失败:`);
    console.error(error.message);

    // 如果是表已存在的错误，视为成功
    if (error.message.includes('already exists')) {
      console.log(`⚠️  表已存在，跳过`);
      return true;
    }

    return false;
  }
}

async function checkTableExists(tableName) {
  try {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = $1
      )`,
      [tableName]
    );
    return result.rows[0].exists;
  } catch (error) {
    console.error(`检查表 ${tableName} 失败:`, error.message);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║        启程平台数据库部署脚本                          ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  // 测试数据库连接
  console.log('🔌 测试数据库连接...');
  try {
    const result = await pool.query('SELECT NOW()');
    console.log(`✅ 数据库连接成功！当前时间: ${result.rows[0].now}`);
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('请检查 .env 文件中的 DATABASE_URL 配置');
    process.exit(1);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 第1步: 部署语义匹配系统');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 检查是否已部署
  const semanticDeployed = await checkTableExists('student_capabilities');
  if (semanticDeployed) {
    console.log('⚠️  语义匹配系统表已存在，跳过部署');
  } else {
    const success = await executeMigration('084_semantic_matching_system.sql');
    if (!success) {
      console.error('❌ 语义匹配系统部署失败');
      process.exit(1);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 第2步: 部署AI导师系统 - P0');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 检查是否已部署
  const mentorP0Deployed = await checkTableExists('mentor_alert_rules');
  if (mentorP0Deployed) {
    console.log('⚠️  AI导师P0系统表已存在，跳过部署');
  } else {
    const success = await executeMigration('085_mentor_enhancement_p0.sql');
    if (!success) {
      console.error('❌ AI导师P0系统部署失败');
      process.exit(1);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 第3步: 部署AI导师系统 - P1');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 检查是否已部署
  const mentorP1Deployed = await checkTableExists('mentor_retrospectives');
  if (mentorP1Deployed) {
    console.log('⚠️  AI导师P1系统表已存在，跳过部署');
  } else {
    const success = await executeMigration('086_mentor_enhancement_p1.sql');
    if (!success) {
      console.error('❌ AI导师P1系统部署失败');
      process.exit(1);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 验证部署结果');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 验证所有表
  const tables = [
    'student_capabilities',
    'task_student_matches',
    'task_translations',
    'mentor_alert_rules',
    'mentor_alerts',
    'mentor_student_profile_cache',
    'mentor_retrospectives'
  ];

  console.log('\n检查数据库表:');
  let allTablesExist = true;
  for (const table of tables) {
    const exists = await checkTableExists(table);
    if (exists) {
      console.log(`  ✅ ${table}`);
    } else {
      console.log(`  ❌ ${table} - 不存在`);
      allTablesExist = false;
    }
  }

  // 统计记录数
  console.log('\n统计表记录数:');
  for (const table of tables) {
    try {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`  📊 ${table}: ${result.rows[0].count} 条记录`);
    } catch (error) {
      console.log(`  ⚠️  ${table}: 无法统计`);
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  if (allTablesExist) {
    console.log('║        ✅ 部署完成！所有表创建成功！                  ║');
  } else {
    console.log('║        ⚠️  部署完成，但有部分表缺失                   ║');
  }
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  console.log('\n下一步:');
  console.log('  1. 重启后端服务: npm run dev');
  console.log('  2. 查看日志: tail -f logs/app.log | grep -E "Matching|Mentor"');
  console.log('  3. 测试API: curl http://localhost:3000/health');
  console.log('');

  await pool.end();
  process.exit(allTablesExist ? 0 : 1);
}

main().catch(error => {
  console.error('❌ 部署脚本执行失败:', error);
  process.exit(1);
});
