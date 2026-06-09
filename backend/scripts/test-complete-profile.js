const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'qicheng',
  user: 'postgres',
  password: 'postgres'
});

async function testCompleteProfile() {
  const client = await pool.connect();

  try {
    console.log('=== 检查users表结构 ===');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    console.log('users表字段：');
    tableInfo.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n=== 检查测试用户 ===');
    const user = await client.query(
      'SELECT id, phone, user_type, profile_completed FROM users WHERE phone = $1',
      ['13900000099']
    );

    if (user.rows.length === 0) {
      console.log('测试用户不存在，创建新用户...');
      const newUser = await client.query(`
        INSERT INTO users (phone, user_type, profile_completed)
        VALUES ($1, $2, $3)
        RETURNING id, phone, user_type, profile_completed
      `, ['13900000099', 'student', false]);
      console.log('创建用户成功：', newUser.rows[0]);
    } else {
      console.log('测试用户：', user.rows[0]);
    }

    console.log('\n=== 检查student_profiles表结构 ===');
    const studentTableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'student_profiles'
      ORDER BY ordinal_position;
    `);
    console.log('student_profiles表字段：');
    studentTableInfo.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n=== 测试完善资料 ===');
    const userId = user.rows.length > 0 ? user.rows[0].id : (await client.query('SELECT id FROM users WHERE phone = $1', ['13900000099'])).rows[0].id;

    // 直接更新users表（所有字段都在users表中）
    console.log('更新用户资料...');
    await client.query(`
      UPDATE users
      SET nickname = $1, bio = $2, university = $3, major = $4, grade = $5, city = $6,
          profile_completed = true, profile_completed_at = NOW()
      WHERE id = $7
    `, ['测试学生', '这是测试简介', '测试大学', '计算机科学', '大三', '北京', userId]);

    console.log('完善资料成功！');

    // 验证结果
    const updatedUser = await client.query(
      'SELECT id, phone, nickname, bio, university, major, grade, city, profile_completed FROM users WHERE id = $1',
      [userId]
    );
    console.log('\n更新后的用户信息：', updatedUser.rows[0]);

  } catch (error) {
    console.error('错误：', error.message);
    console.error('详细信息：', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testCompleteProfile();
