// 完整部署验证脚本 - 使用Node.js
// 文件位置: backend/scripts/verify-deployment.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

let PASSED = 0;
let FAILED = 0;
let WARNINGS = 0;

function logPass(msg) {
  console.log(`  ✅ ${msg}`);
  PASSED++;
}

function logFail(msg) {
  console.log(`  ❌ ${msg}`);
  FAILED++;
}

function logWarn(msg) {
  console.log(`  ⚠️  ${msg}`);
  WARNINGS++;
}

async function checkTable(tableName) {
  const result = await pool.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)`,
    [tableName]
  );
  return result.rows[0].exists;
}

async function getTableCount(tableName) {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  } catch (error) {
    return -1;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║        完整部署验证报告                                ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // 测试数据库连接
  console.log('🔌 测试数据库连接...');
  try {
    const result = await pool.query('SELECT NOW()');
    logPass(`数据库连接成功 (${result.rows[0].now.toLocaleString()})`);
  } catch (error) {
    logFail('数据库连接失败');
    process.exit(1);
  }

  // 检查语义匹配系统表
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 语义匹配系统');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const semanticTables = [
    'student_capabilities',
    'task_student_matches',
    'task_translations'
  ];

  for (const table of semanticTables) {
    const exists = await checkTable(table);
    if (exists) {
      const count = await getTableCount(table);
      logPass(`${table} (${count} 条记录)`);
    } else {
      logFail(`${table} 不存在`);
    }
  }

  // 检查tasks表扩展字段
  console.log('\n检查tasks表扩展字段:');
  const tasksFields = ['matching_enabled', 'matched_students_count', 'top_match_score'];
  for (const field of tasksFields) {
    const result = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'tasks' AND column_name = $1`,
      [field]
    );
    if (result.rows.length > 0) {
      logPass(`tasks.${field}`);
    } else {
      logWarn(`tasks.${field} 不存在`);
    }
  }

  // 检查AI导师系统表
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 AI导师系统');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const mentorTables = [
    'mentor_alert_rules',
    'mentor_alerts',
    'mentor_student_profile_cache',
    'mentor_retrospectives',
    'mentor_sessions',
    'mentor_growth_observations'
  ];

  for (const table of mentorTables) {
    const exists = await checkTable(table);
    if (exists) {
      const count = await getTableCount(table);
      logPass(`${table} (${count} 条记录)`);
    } else {
      logFail(`${table} 不存在`);
    }
  }

  // 检查索引
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 索引检查');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const indexes = [
    'idx_student_capabilities_student',
    'idx_student_capabilities_vector',
    'idx_matches_task',
    'idx_mentor_alerts_student'
  ];

  for (const index of indexes) {
    const result = await pool.query(
      `SELECT 1 FROM pg_indexes WHERE indexname = $1`,
      [index]
    );
    if (result.rows.length > 0) {
      logPass(index);
    } else {
      logWarn(`${index} 不存在`);
    }
  }

  // 检查视图
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👁️  视图检查');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const views = ['student_matching_overview', 'task_matching_overview'];
  for (const view of views) {
    const result = await pool.query(
      `SELECT 1 FROM information_schema.views WHERE table_name = $1`,
      [view]
    );
    if (result.rows.length > 0) {
      logPass(view);
    } else {
      logWarn(`${view} 不存在`);
    }
  }

  // 检查代码文件
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📁 代码文件检查');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const fs = require('fs');
  const path = require('path');

  const codeFiles = [
    'src/services/vectorGenerationService.ts',
    'src/services/semanticMatchingEngine.ts',
    'src/services/qichengTeacherService.ts',
    'src/services/matchingScheduler.ts',
    'src/routes/tasks/matchingController.ts',
    'src/services/mentorAlertService.ts',
    'src/services/mentorMemoryService.ts'
  ];

  for (const file of codeFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      logPass(file);
    } else {
      logFail(`${file} 不存在`);
    }
  }

  // 总结
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║                  验证完成                              ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('测试结果:');
  console.log(`  ✅ 通过: ${PASSED}`);
  console.log(`  ❌ 失败: ${FAILED}`);
  console.log(`  ⚠️  警告: ${WARNINGS}\n`);

  if (FAILED === 0) {
    if (WARNINGS === 0) {
      console.log('✅ 所有测试通过！系统已就绪！\n');
    } else {
      console.log(`⚠️  系统基本就绪，但有 ${WARNINGS} 个警告\n`);
    }
  } else {
    console.log(`❌ 有 ${FAILED} 个测试失败，请检查部署\n`);
  }

  console.log('下一步:');
  console.log('  1. 重启服务: npm run dev');
  console.log('  2. 查看日志: tail -f logs/app.log | grep -E "Matching|Mentor"');
  console.log('  3. 测试API: curl http://localhost:3000/health\n');

  await pool.end();
  process.exit(FAILED > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ 验证脚本执行失败:', error);
  process.exit(1);
});
