import { Pool } from 'pg';
import logger from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng',
  });

  try {
    logger.info('连接数据库...');

    const migrationPath = path.join(__dirname, '../../scripts/db/016_fix_ai_matches_uuid.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    logger.info('执行迁移: 016_fix_ai_matches_uuid.sql');
    logger.info('修复 ai_matches 表的 UUID 类型问题...');

    await pool.query(sql);

    logger.info('✅ 迁移成功完成！');
    logger.info('已修复：');
    logger.info('  - ai_matches.task_id: INTEGER → UUID');
    logger.info('  - ai_matches.student_id: INTEGER → UUID');

  } catch (error) {
    logger.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
