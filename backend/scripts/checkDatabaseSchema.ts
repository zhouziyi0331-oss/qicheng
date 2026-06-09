/**
 * 数据库Schema验证脚本
 *
 * 检查AI导师真实数据集成所需的所有表和字段是否存在
 */

import { query } from '../src/utils/db';
import logger from '../src/utils/logger';

interface SchemaCheck {
  table: string;
  requiredColumns: string[];
  found: string[];
  missing: string[];
  passed: boolean;
}

const results: SchemaCheck[] = [];

/**
 * 检查表的列是否存在
 */
async function checkTableColumns(tableName: string, requiredColumns: string[]): Promise<SchemaCheck> {
  try {
    const result = await query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = $1
       AND table_schema = 'public'`,
      [tableName]
    );

    const foundColumns = result.map(r => r.column_name);
    const missingColumns = requiredColumns.filter(col => !foundColumns.includes(col));

    return {
      table: tableName,
      requiredColumns,
      found: foundColumns,
      missing: missingColumns,
      passed: missingColumns.length === 0
    };

  } catch (error: any) {
    logger.error(`检查表 ${tableName} 失败:`, error);
    return {
      table: tableName,
      requiredColumns,
      found: [],
      missing: requiredColumns,
      passed: false
    };
  }
}

/**
 * 主检查流程
 */
async function main(): Promise<void> {
  console.log('🔍 开始检查数据库Schema...\n');

  // 1. 检查 mentor_sessions
  console.log('检查 mentor_sessions 表...');
  results.push(await checkTableColumns('mentor_sessions', [
    'id',
    'student_id',
    'task_id',
    'status',
    'message_count',
    'last_message_at',
    'started_at',
    'created_at'
  ]));

  // 2. 检查 mentor_messages
  console.log('检查 mentor_messages 表...');
  results.push(await checkTableColumns('mentor_messages', [
    'id',
    'session_id',
    'role',
    'content',
    'detected_signals',
    'tokens_used',
    'created_at'
  ]));

  // 3. 检查 mentor_growth_observations
  console.log('检查 mentor_growth_observations 表...');
  results.push(await checkTableColumns('mentor_growth_observations', [
    'id',
    'student_id',
    'task_id',
    'observation_type',
    'observation_content',
    'skills_demonstrated',
    'context',
    'created_at'
  ]));

  // 4. 检查 user_ability_profiles
  console.log('检查 user_ability_profiles 表...');
  results.push(await checkTableColumns('user_ability_profiles', [
    'id',
    'user_id',
    'gap_to_fill',
    'is_current',
    'created_at',
    'updated_at'
  ]));

  // 5. 检查 orders
  console.log('检查 orders 表...');
  results.push(await checkTableColumns('orders', [
    'id',
    'student_id',
    'task_id',
    'status',
    'client_rating',
    'created_at',
    'completed_at'
  ]));

  // 6. 检查 tasks
  console.log('检查 tasks 表...');
  results.push(await checkTableColumns('tasks', [
    'id',
    'title',
    'description',
    'track',
    'acceptance_criteria',
    'created_at'
  ]));

  // 7. 检查 task_reviews
  console.log('检查 task_reviews 表...');
  results.push(await checkTableColumns('task_reviews', [
    'id',
    'order_id',
    'comment',
    'created_at'
  ]));

  // 8. 检查 users
  console.log('检查 users 表...');
  results.push(await checkTableColumns('users', [
    'id',
    'nickname',
    'user_type',
    'current_level',
    'created_at'
  ]));

  // 9. 检查 opc_v2_results (如果存在)
  console.log('检查 opc_v2_results 表...');
  results.push(await checkTableColumns('opc_v2_results', [
    'id',
    'user_id',
    'openness_score',
    'persistence_score',
    'creativity_score',
    'personality_tags',
    'created_at'
  ]));

  console.log('\n✅ Schema检查完成\n');

  // 打印报告
  printReport();

  // 如果有缺失字段，生成修复SQL
  generateFixSQL();

  process.exit(0);
}

/**
 * 打印检查报告
 */
function printReport(): void {
  console.log('════════════════════════════════════════════════════');
  console.log('           数据库Schema检查报告');
  console.log('════════════════════════════════════════════════════\n');

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.table}`);

    if (!result.passed) {
      console.log(`   缺失字段: ${result.missing.join(', ')}`);
    } else {
      console.log(`   所有字段存在 (${result.found.length}个)`);
    }
    console.log();
  });

  console.log('────────────────────────────────────────────────────');
  console.log(`总表数: ${results.length}`);
  console.log(`通过: ${passedCount}`);
  console.log(`失败: ${failedCount}`);
  console.log('════════════════════════════════════════════════════\n');

  if (passedCount === results.length) {
    console.log('🎉 数据库Schema完整，可以运行AI导师系统！\n');
  } else {
    console.log('⚠️  发现缺失字段，请查看下面的修复SQL\n');
  }
}

/**
 * 生成修复SQL
 */
function generateFixSQL(): void {
  const failedResults = results.filter(r => !r.passed);

  if (failedResults.length === 0) {
    return;
  }

  console.log('════════════════════════════════════════════════════');
  console.log('           修复SQL（如需要）');
  console.log('════════════════════════════════════════════════════\n');

  failedResults.forEach(result => {
    if (result.found.length === 0) {
      console.log(`-- 表 ${result.table} 不存在，需要创建`);
      console.log(`-- 请查看相关migration文件\n`);
    } else {
      console.log(`-- 为表 ${result.table} 添加缺失字段`);
      result.missing.forEach(col => {
        // 根据字段名推断类型（简化版）
        let colType = 'TEXT';
        if (col.includes('_id')) {
          colType = 'UUID REFERENCES ...';
        } else if (col.includes('_at')) {
          colType = 'TIMESTAMPTZ DEFAULT NOW()';
        } else if (col.includes('_count') || col.includes('score')) {
          colType = 'INTEGER DEFAULT 0';
        } else if (col.includes('is_')) {
          colType = 'BOOLEAN DEFAULT false';
        } else if (col === 'context' || col === 'detected_signals' || col.includes('_tags')) {
          colType = 'JSONB';
        }

        console.log(`ALTER TABLE ${result.table} ADD COLUMN IF NOT EXISTS ${col} ${colType};`);
      });
      console.log();
    }
  });

  console.log('════════════════════════════════════════════════════\n');
}

// 执行检查
main();
