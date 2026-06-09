require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 检查环境变量
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL 环境变量未设置');
  process.exit(1);
}

console.log('数据库连接:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('开始运行数据库迁移...');

    // 读取迁移文件
    const migrationPath = path.join(__dirname, '../migrations/054_mentor_stage_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // 执行迁移
    await client.query(sql);

    console.log('✅ 数据库迁移完成！');
    console.log('已创建以下表：');
    console.log('  - mentor_stage_sessions');
    console.log('  - mentor_stage_messages');
    console.log('  - mentor_prompt_templates');
    console.log('  - mentor_feedback_translations');
    console.log('已扩展以下表：');
    console.log('  - tasks (添加mentor相关字段)');
    console.log('  - task_deliverables (添加预审字段)');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    console.error('详细错误:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n迁移脚本执行完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n迁移脚本执行失败:', error);
    process.exit(1);
  });
