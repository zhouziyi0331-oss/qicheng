import { pool } from '../src/utils/db';
import { promises as fs } from 'fs';
import * as path from 'path';

async function runMigration(migrationFile: string) {
  const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);

  console.log(`正在运行迁移: ${migrationFile}`);

  try {
    const sql = await fs.readFile(migrationPath, 'utf-8');

    const client = await pool.connect();
    try {
      await client.query(sql);
      console.log(`✅ 迁移成功: ${migrationFile}`);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error(`❌ 迁移失败: ${migrationFile}`);
    console.error(error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('请指定迁移文件名，例如: npm run migrate:run 094_semantic_matching_system.sql');
  process.exit(1);
}

runMigration(migrationFile).catch(() => process.exit(1));
