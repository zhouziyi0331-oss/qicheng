import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng'
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 导入更多核心标签...');
    
    const migrationPath = path.join(__dirname, '../../migrations/201_more_talent_tags.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    await client.query(migrationSQL);
    
    console.log('✅ 导入成功！');
    
    const tagCountResult = await client.query('SELECT COUNT(*) as count FROM talent_tags');
    console.log(`\n🏷️  总标签数量: ${tagCountResult.rows[0].count}`);
    
    const categoryResult = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM talent_tags 
      GROUP BY category 
      ORDER BY category
    `);
    
    console.log('\n📊 按分类统计:');
    categoryResult.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count}个`);
    });
    
  } catch (error: any) {
    console.error('❌ 失败:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n✨ 完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 失败:', error);
    process.exit(1);
  });
