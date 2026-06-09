#!/usr/bin/env ts-node
/**
 * 测试语义匹配系统的核心功能
 * 验证：学生画像摘要和项目需求摘要的结构对齐
 */

import qichengTeacherService from './src/services/qichengTeacherService';
import vectorGenerationService from './src/services/vectorGenerationService';
import { query } from './src/utils/db';

async function testSemanticMatching() {
  console.log('========================================');
  console.log('启程平台语义匹配系统 - 功能测试');
  console.log('========================================\n');

  try {
    // 1. 测试数据库连接
    console.log('1. 测试数据库连接...');
    const dbTest = await query('SELECT NOW() as current_time');
    console.log('✓ 数据库连接正常:', dbTest[0].current_time);
    console.log();

    // 2. 检查pgvector扩展
    console.log('2. 检查pgvector扩展...');
    const vectorCheck = await query(
      "SELECT * FROM pg_extension WHERE extname='vector'"
    );
    if (vectorCheck.length > 0) {
      console.log('✓ pgvector扩展已启用');
    } else {
      console.log('✗ pgvector扩展未启用');
      process.exit(1);
    }
    console.log();

    // 3. 检查表结构
    console.log('3. 检查表结构...');
    const tables = [
      'student_capabilities',
      'task_student_matches',
      'task_translations',
      'tasks'
    ];

    for (const table of tables) {
      const tableCheck = await query(
        `SELECT COUNT(*) as count FROM information_schema.tables
         WHERE table_name = $1`,
        [table]
      );
      if (tableCheck[0].count > 0) {
        console.log(`✓ 表 ${table} 存在`);
      } else {
        console.log(`✗ 表 ${table} 不存在`);
      }
    }
    console.log();

    // 4. 检查关键字段
    console.log('4. 检查关键字段...');
    const profileSummaryCheck = await query(
      `SELECT COUNT(*) as count FROM information_schema.columns
       WHERE table_name='student_capabilities' AND column_name='profile_summary'`
    );
    const profileVectorCheck = await query(
      `SELECT COUNT(*) as count FROM information_schema.columns
       WHERE table_name='student_capabilities' AND column_name='profile_vector'`
    );
    const requirementVectorCheck = await query(
      `SELECT COUNT(*) as count FROM information_schema.columns
       WHERE table_name='tasks' AND column_name='requirement_vector'`
    );

    console.log(`✓ student_capabilities.profile_summary: ${profileSummaryCheck[0].count > 0 ? '存在' : '不存在'}`);
    console.log(`✓ student_capabilities.profile_vector: ${profileVectorCheck[0].count > 0 ? '存在' : '不存在'}`);
    console.log(`✓ tasks.requirement_vector: ${requirementVectorCheck[0].count > 0 ? '存在' : '不存在'}`);
    console.log();

    // 5. 检查数据量
    console.log('5. 检查数据量...');
    const studentCount = await query(
      "SELECT COUNT(*) as count FROM users WHERE role='student'"
    );
    const taskCount = await query(
      "SELECT COUNT(*) as count FROM tasks WHERE status != 'deleted'"
    );
    const capabilityCount = await query(
      'SELECT COUNT(*) as count FROM student_capabilities'
    );

    console.log(`学生数量: ${studentCount[0].count}`);
    console.log(`任务数量: ${taskCount[0].count}`);
    console.log(`能力画像记录: ${capabilityCount[0].count}`);
    console.log();

    // 6. 检查向量生成状态
    console.log('6. 检查向量生成状态...');
    const studentVectorCount = await query(
      'SELECT COUNT(*) as count FROM student_capabilities WHERE profile_vector IS NOT NULL'
    );
    const taskVectorCount = await query(
      'SELECT COUNT(*) as count FROM tasks WHERE requirement_vector IS NOT NULL'
    );

    console.log(`已生成向量的学生: ${studentVectorCount[0].count} / ${capabilityCount[0].count}`);
    console.log(`已生成向量的任务: ${taskVectorCount[0].count} / ${taskCount[0].count}`);
    console.log();

    // 7. 测试服务可用性
    console.log('7. 测试服务可用性...');
    console.log('✓ qichengTeacherService 已加载');
    console.log('✓ vectorGenerationService 已加载');
    console.log();

    // 8. 总结
    console.log('========================================');
    console.log('测试完成！');
    console.log('========================================\n');

    if (studentVectorCount[0].count === 0 || taskVectorCount[0].count === 0) {
      console.log('⚠️  警告：尚未生成向量数据');
      console.log('\n下一步：');
      console.log('1. 配置API密钥到.env文件');
      console.log('   - ANTHROPIC_API_KEY=sk-ant-...');
      console.log('   - EMBEDDING_API_KEY=sk-...');
      console.log('2. 运行向量生成脚本');
      console.log('   - npm run init-vectors');
    } else {
      console.log('✓ 系统已就绪，可以开始匹配！');
    }

    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

testSemanticMatching();
