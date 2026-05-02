import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng',
  });

  try {
    console.log('连接数据库...');

    const migrationPath = path.join(__dirname, '../../scripts/db/016_fix_ai_matches_uuid.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('执行迁移: 016_fix_ai_matches_uuid.sql');
    console.log('修复 ai_matches 表的 UUID 类型问题...');

    await pool.query(sql);

    console.log('✅ 迁移成功完成！');
    console.log('已修复：');
    console.log('  - ai_matches.task_id: INTEGER → UUID');
    console.log('  - ai_matches.student_id: INTEGER → UUID');

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
