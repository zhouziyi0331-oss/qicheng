#!/usr/bin/env node
/**
 * 测试语义匹配系统的核心功能
 * 验证：学生画像摘要和项目需求摘要的结构对齐
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
      console.log('✓ pgvector扩展已启用, 版本:', vectorCheck[0].extversion);
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
      if (parseInt(tableCheck[0].count) > 0) {
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

    console.log(`${parseInt(profileSummaryCheck[0].count) > 0 ? '✓' : '✗'} student_capabilities.profile_summary`);
    console.log(`${parseInt(profileVectorCheck[0].count) > 0 ? '✓' : '✗'} student_capabilities.profile_vector`);
    console.log(`${parseInt(requirementVectorCheck[0].count) > 0 ? '✓' : '✗'} tasks.requirement_vector`);
    console.log();

    // 5. 检查数据量
    console.log('5. 检查数据量...');
    const studentCount = await query(
      "SELECT COUNT(*) as count FROM users WHERE role='student'"
    );
    const taskCount = await query(
      "SELECT COUNT(*) as count FROM tasks"
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

    // 7. 检查API配置
    console.log('7. 检查API配置...');
    const hasAnthropicKey = process.env.ANTHROPIC_API_KEY &&
                            process.env.ANTHROPIC_API_KEY !== 'sk-ant-api03-...';
    const hasEmbeddingKey = process.env.EMBEDDING_API_KEY &&
                            process.env.EMBEDDING_API_KEY !== 'sk-...';

    console.log(`${hasAnthropicKey ? '✓' : '✗'} ANTHROPIC_API_KEY ${hasAnthropicKey ? '已配置' : '未配置'}`);
    console.log(`${hasEmbeddingKey ? '✓' : '✗'} EMBEDDING_API_KEY ${hasEmbeddingKey ? '已配置' : '未配置'}`);
    console.log();

    // 8. 总结
    console.log('========================================');
    console.log('测试完成！');
    console.log('========================================\n');

    const needsVectors = parseInt(studentVectorCount[0].count) === 0 ||
                        parseInt(taskVectorCount[0].count) === 0;
    const needsApiKeys = !hasAnthropicKey || !hasEmbeddingKey;

    if (needsApiKeys) {
      console.log('⚠️  需要配置API密钥\n');
      console.log('编辑 .env 文件，添加：');
      if (!hasAnthropicKey) {
        console.log('  ANTHROPIC_API_KEY=sk-ant-api03-xxxxx');
      }
      if (!hasEmbeddingKey) {
        console.log('  EMBEDDING_API_KEY=sk-xxxxx');
      }
      console.log('\n获取方式：');
      console.log('  - Anthropic: https://console.anthropic.com/');
      console.log('  - 硅基流动: https://siliconflow.cn\n');
    }

    if (needsVectors && !needsApiKeys) {
      console.log('⚠️  API已配置，但尚未生成向量\n');
      console.log('运行以下命令生成向量：');
      console.log('  npm run init-vectors\n');
    }

    if (!needsApiKeys && !needsVectors) {
      console.log('✅ 系统已就绪，可以开始匹配！\n');
      console.log('测试匹配：');
      console.log('  curl -X POST http://localhost:3000/api/v1/tasks/{taskId}/trigger-matching \\');
      console.log('    -H "Authorization: Bearer {token}"\n');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testSemanticMatching();
