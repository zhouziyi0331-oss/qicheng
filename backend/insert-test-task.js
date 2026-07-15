const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'qicheng_db',
  user: 'qicheng_user',
  password: 'qicheng2024'
});

async function insertTestTask() {
  try {
    await pool.query(`
      INSERT INTO tasks (id, title, description, enterprise_id, status, created_at, updated_at)
      VALUES 
        ('00000000-0000-0000-0000-000000000002', '测试任务', '用于Phase R2测试', '00000000-0000-0000-0000-000000000001', 'open', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ 测试任务插入成功');
  } catch (error) {
    console.error('❌ 插入失败:', error.message);
  } finally {
    await pool.end();
  }
}

insertTestTask();
