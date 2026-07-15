// 使用应用的数据库连接
const { query } = require('./dist/utils/db');

async function insertTestTask() {
  try {
    await query(`
      INSERT INTO tasks (id, title, description, enterprise_id, status, created_at, updated_at)
      VALUES 
        ('00000000-0000-0000-0000-000000000002', '测试任务', '用于Phase R2测试', '00000000-0000-0000-0000-000000000001', 'open', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ 测试任务插入成功');
    process.exit(0);
  } catch (error) {
    console.error('❌ 插入失败:', error.message);
    process.exit(1);
  }
}

insertTestTask();
