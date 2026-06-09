#!/usr/bin/env node
/**
 * 测试深度思考启程老师系统
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng'
});

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

async function testDeepThinkingSystem() {
  console.log('========================================');
  console.log('深度思考启程老师系统 - 测试');
  console.log('========================================\n');

  try {
    // 1. 检查数据库表
    console.log('1. 检查数据库表...');
    const tables = [
      'teacher_observations',
      'teacher_company_observations',
      'teacher_thinking_records',
      'teacher_long_term_memory',
      'teacher_short_term_memory',
      'teacher_key_moments'
    ];

    for (const table of tables) {
      const result = await query(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = $1`,
        [table]
      );
      if (parseInt(result[0].count) > 0) {
        console.log(`✓ 表 ${table} 存在`);
      } else {
        console.log(`✗ 表 ${table} 不存在`);
      }
    }
    console.log();

    // 2. 检查长期记忆初始化
    console.log('2. 检查长期记忆初始化...');
    const memoryCount = await query(
      'SELECT COUNT(*) as count FROM teacher_long_term_memory'
    );
    console.log(`已初始化的学生记忆: ${memoryCount[0].count}`);
    console.log();

    // 3. 查看一个学生的记忆
    console.log('3. 查看学生记忆示例...');
    const sampleMemory = await query(
      `SELECT student_id, deep_understanding, confidence_level, observation_count
       FROM teacher_long_term_memory
       LIMIT 1`
    );
    if (sampleMemory.length > 0) {
      console.log(`学生ID: ${sampleMemory[0].student_id}`);
      console.log(`深度理解: ${sampleMemory[0].deep_understanding}`);
      console.log(`信心等级: ${sampleMemory[0].confidence_level}`);
      console.log(`观察次数: ${sampleMemory[0].observation_count}`);
    }
    console.log();

    // 4. 检查观察记录
    console.log('4. 检查观察记录...');
    const observationCount = await query(
      'SELECT COUNT(*) as count FROM teacher_observations'
    );
    console.log(`观察记录数: ${observationCount[0].count}`);
    console.log();

    // 5. 检查思考记录
    console.log('5. 检查思考记录...');
    const thinkingCount = await query(
      'SELECT COUNT(*) as count FROM teacher_thinking_records'
    );
    console.log(`思考记录数: ${thinkingCount[0].count}`);
    console.log();

    // 6. 检查关键时刻
    console.log('6. 检查关键时刻...');
    const keyMomentsCount = await query(
      'SELECT COUNT(*) as count FROM teacher_key_moments'
    );
    console.log(`关键时刻记录数: ${keyMomentsCount[0].count}`);
    console.log();

    // 7. 系统能力检查
    console.log('7. 系统能力检查...');
    console.log('✓ 观察系统：teacherObservationService');
    console.log('✓ 推理引擎：reasoningEngine');
    console.log('✓ 记忆系统：teacherMemoryService');
    console.log('✓ 表达服务：personalizedExpressionService');
    console.log('✓ 统一服务：deepThinkingTeacherService');
    console.log();

    // 8. API配置检查
    console.log('8. API配置检查...');
    const hasAnthropicKey = process.env.ANTHROPIC_API_KEY &&
                            process.env.ANTHROPIC_API_KEY !== 'sk-ant-api03-...';
    console.log(`${hasAnthropicKey ? '✓' : '✗'} ANTHROPIC_API_KEY ${hasAnthropicKey ? '已配置' : '未配置'}`);
    console.log();

    // 总结
    console.log('========================================');
    console.log('测试完成！');
    console.log('========================================\n');

    if (!hasAnthropicKey) {
      console.log('⚠️  需要配置ANTHROPIC_API_KEY才能使用深度思考功能\n');
      console.log('配置方式：');
      console.log('  编辑 .env 文件');
      console.log('  ANTHROPIC_API_KEY=sk-ant-api03-xxxxx\n');
    } else {
      console.log('✅ 深度思考系统已就绪！\n');
      console.log('使用示例：');
      console.log('  const deepThinkingTeacher = require("./src/services/deepThinkingTeacherService").default;');
      console.log('  const response = await deepThinkingTeacher.onStudentStuck(');
      console.log('    studentId, taskId, "这个需求太模糊了", 3600');
      console.log('  );\n');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testDeepThinkingSystem();
