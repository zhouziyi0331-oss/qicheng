/**
 * 运行工作条件匹配系统的数据库迁移
 */

const fs = require('fs');
const { pool } = require('./src/utils/db');

async function runMigration() {
  console.log('开始运行 migration 075: 工作条件匹配系统');
  console.log('='.repeat(60));

  try {
    // 读取SQL文件
    const sql = fs.readFileSync('./migrations/075_work_condition_matching_system.sql', 'utf8');

    // 执行SQL
    await pool.query(sql);

    console.log('✅ Migration 075 执行成功！');
    console.log('\n已创建的表：');
    console.log('  1. student_work_condition_profiles - 学生工作条件画像表');
    console.log('  2. project_requirement_profiles - 项目需求条件画像表');
    console.log('  3. work_condition_matches - 工作条件匹配记录表');
    console.log();

  } catch (error) {
    console.error('❌ Migration 执行失败:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);
