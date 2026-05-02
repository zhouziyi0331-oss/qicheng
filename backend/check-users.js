const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'qicheng',
  user: 'postgres',
  password: 'postgres'
});

async function checkUsers() {
  try {
    // 查看表结构
    const columns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('users表字段:');
    columns.rows.forEach(row => console.log('  -', row.column_name));

    console.log('\n用户列表:');
    const users = await pool.query('SELECT id, nickname, role, phone FROM users LIMIT 5');
    console.table(users.rows);

  } catch (err) {
    console.error('错误:', err.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
