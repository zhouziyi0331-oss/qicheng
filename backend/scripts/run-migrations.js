const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng'
});

async function runMigrations() {
  try {
    // 创建 migrations 表（如果不存在）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 获取已执行的迁移
    const { rows: executed } = await pool.query('SELECT name FROM migrations');
    const executedNames = new Set(executed.map(r => r.name));

    // 读取所有迁移文件
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`找到 ${files.length} 个迁移文件`);
    console.log(`已执行 ${executedNames.size} 个迁移`);

    // 执行未运行的迁移
    for (const file of files) {
      if (executedNames.has(file)) {
        console.log(`⏭️  跳过: ${file}`);
        continue;
      }

      console.log(`🔄 执行: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      try {
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        await pool.query('COMMIT');
        console.log(`✅ 完成: ${file}`);
      } catch (err) {
        await pool.query('ROLLBACK');
        console.error(`❌ 失败: ${file}`);
        console.error(err.message);
        throw err;
      }
    }

    console.log('\n✅ 所有迁移执行完成');
  } catch (err) {
    console.error('迁移失败:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
