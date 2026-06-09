import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 运行082迁移：学生成长数据闭环系统
 */
async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng',
  });

  try {
    console.log('🚀 开始执行迁移: 082_student_growth_data_loop.sql\n');
    console.log('📡 连接数据库...');

    // 读取迁移文件
    const migrationPath = path.join(__dirname, '../../migrations/082_student_growth_data_loop.sql');

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`迁移文件不存在: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`📄 读取迁移文件成功 (${sql.length} 字符)\n`);

    console.log('⏳ 执行迁移...\n');

    // 执行迁移
    await pool.query(sql);

    console.log('✅ 迁移执行成功！\n');

    // 验证结果
    console.log('🔍 验证迁移结果...\n');

    // 检查新表
    const tables = ['ability_dimension_history', 'growth_summary_cache', 'graduation_report_payments'];
    for (const table of tables) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        )`,
        [table]
      );
      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} 表 ${table}: ${exists ? '已创建' : '未找到'}`);
    }

    // 检查视图
    const viewResult = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'student_growth_overview'
      )`
    );
    const viewExists = viewResult.rows[0].exists;
    console.log(`  ${viewExists ? '✅' : '❌'} 视图 student_growth_overview: ${viewExists ? '已创建' : '未找到'}`);

    console.log('\n🎉 学生成长数据闭环系统 Migration 完成！');
    console.log('\n已添加：');
    console.log('  - 3个新表：ability_dimension_history, growth_summary_cache, graduation_report_payments');
    console.log('  - 扩展现有表：mentor_growth_observations, user_ability_profiles, growth_reports');
    console.log('  - 1个视图：student_growth_overview');
    console.log('\n下一步：运行测试数据生成脚本');
    console.log('  npx ts-node src/scripts/generateTestData.ts');

  } catch (error: any) {
    console.error('❌ 迁移失败:', error.message);
    if (error.stack) {
      console.error('\n错误堆栈:', error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
