const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
const client = new Client({ connectionString });

async function createTestAssignment() {
  try {
    await client.connect();

    // 创建测试订单
    const result = await client.query(`
      INSERT INTO task_assignments (id, task_id, student_id, status, accepted_at)
      VALUES (
        '550e8400-e29b-41d4-a716-446655440000',
        '550e8400-e29b-41d4-a716-446655440001',
        'f1241d8a-985e-4e99-9b66-2d88a54b6674',
        'accepted',
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id;
    `);

    console.log('测试订单创建成功:', result.rows);

    // 查询订单
    const check = await client.query(`
      SELECT ta.id, ta.task_id, ta.student_id, ta.status, t.budget_net, t.title
      FROM task_assignments ta
      LEFT JOIN tasks t ON ta.task_id = t.id
      WHERE ta.id = '550e8400-e29b-41d4-a716-446655440000';
    `);

    console.log('订单详情:', check.rows);

  } catch (err) {
    console.error('错误:', err.message);
  } finally {
    await client.end();
  }
}

createTestAssignment();
