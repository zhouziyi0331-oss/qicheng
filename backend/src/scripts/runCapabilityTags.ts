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
    console.log('🚀 创建能力积累和需求拆解标签系统...');
    
    const migrationPath = path.join(__dirname, '../../migrations/202_capability_and_requirement_tags.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    await client.query(migrationSQL);
    
    console.log('✅ 创建成功！');
    
    // 查询创建的表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%student_%' OR table_name LIKE '%business_%' OR table_name LIKE '%task_requirement_breakdown%')
      AND table_name NOT LIKE '%talent%'
      ORDER BY table_name
    `);
    
    console.log('\n📊 新创建的表:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // 查询业务场景标签数量
    const scenarioCountResult = await client.query('SELECT COUNT(*) as count FROM business_scenario_tags');
    console.log(`\n🏷️  导入的业务场景标签: ${scenarioCountResult.rows[0].count}个`);
    
    // 查询提取规则数量
    const rulesCountResult = await client.query('SELECT COUNT(*) as count FROM tag_extraction_rules');
    console.log(`📏 提取规则: ${rulesCountResult.rows[0].count}条`);
    
    // 显示部分场景标签
    const scenariosResult = await client.query(`
      SELECT category, scenario_name, difficulty_level 
      FROM business_scenario_tags 
      ORDER BY id 
      LIMIT 10
    `);
    
    console.log('\n📋 示例业务场景标签:');
    scenariosResult.rows.forEach(tag => {
      console.log(`  • ${tag.scenario_name} (${tag.category}, ${tag.difficulty_level})`);
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
