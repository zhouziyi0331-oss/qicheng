import { Pool } from 'pg';
import logger from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 运行数据库迁移脚本
 */
async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng',
  });

  try {
    logger.info('连接数据库...');

    // 读取迁移文件
    const migrationPath = path.join(__dirname, '../../scripts/db/015_hybrid_matching_embeddings.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    logger.info('执行迁移: 015_hybrid_matching_embeddings.sql');

    // 执行迁移
    await pool.query(sql);

    logger.info('✅ 迁移成功完成！');
    logger.info('已添加：');
    logger.info('  - pgvector扩展');
    logger.info('  - tasks表的embedding字段（title_embedding, description_embedding, combined_embedding）');
    logger.info('  - users表的embedding字段（skills_embedding, interests_embedding, profile_embedding）');
    logger.info('  - ai_match_logs表（记录混合匹配日志）');
    logger.info('  - 向量索引（加速相似度搜索）');

  } catch (error) {
    logger.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
