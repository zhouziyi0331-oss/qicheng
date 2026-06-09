#!/usr/bin/env ts-node
/**
 * 测试Claude推理服务 - 使用Claude自己的推理能力
 */

import dotenv from 'dotenv';
import { Pool } from 'pg';
import claudeReasoningService from './src/services/claudeReasoningService';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng'
});

async function query(sql: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

async function testClaudeReasoning() {
  console.log('========================================');
  console.log('Claude推理服务测试');
  console.log('使用Claude自己的推理能力');
  console.log('========================================\n');

  try {
    // 获取一个学生
    const students = await query(
      "SELECT id, nickname FROM users WHERE role='student' LIMIT 1"
    );

    if (students.length === 0) {
      console.log('❌ 没有找到学生数据');
      process.exit(1);
    }

    const studentId = students[0].id;
    const studentName = students[0].nickname || '测试学生';

    console.log(`测试学生: ${studentName} (${studentId})\n`);

    // 场景：学生求助
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('场景：学生求助');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('学生说："这个需求太模糊了，我不知道客户到底要什么"\n');

    console.log('🧠 Claude开始深度思考...\n');

    const startTime = Date.now();

    const result = await claudeReasoningService.think({
      studentId,
      question: '学生真正卡在哪里？如何引导他自己找到方向？',
      currentSituation: '这个需求太模糊了，我不知道客户到底要什么',
      taskId: 'test-task-id'
    });

    const elapsed = Date.now() - startTime;

    console.log('✅ 思考完成！\n');

    // 显示学生画像
    console.log('【第一步：学生画像分析】');
    console.log(`  完成任务数: ${result.profile.tasksCompleted.toFixed(0)}`);
    console.log(`  平均质量: ${result.profile.avgQuality.toFixed(1)}分`);
    console.log(`  工作风格: ${result.profile.workStyle}（${
      result.profile.workStyle === 'cautious' ? '谨慎型' :
      result.profile.workStyle === 'impulsive' ? '冲动型' : '自信型'
    }）`);
    console.log(`  学习模式: ${result.profile.learningPattern}`);
    console.log(`  求助率: ${(result.profile.helpRequestRate * 100).toFixed(0)}%`);
    console.log(`  修改率: ${(result.profile.revisionRate * 100).toFixed(0)}%`);
    console.log(`  情绪状态:`);
    console.log(`    - 信心: ${(result.profile.recentConfidence * 100).toFixed(0)}%`);
    console.log(`    - 挫折感: ${(result.profile.recentFrustration * 100).toFixed(0)}%`);
    console.log(`    - 投入度: ${(result.profile.recentEngagement * 100).toFixed(0)}%`);
    console.log();

    // 显示深度分析
    console.log('【第二步：理解"言外之意"】');
    console.log(`  表面意思: ${result.analysis.surfaceMeaning}`);
    console.log(`  言外之意: ${result.analysis.impliedMeaning}`);
    console.log(`  置信度: ${result.analysis.confidence}`);
    console.log(`  推理依据:`);
    console.log(`    ${result.analysis.reasoning}`);
    console.log();

    // 显示假设
    console.log('【第三步：生成假设】');
    result.hypotheses.forEach((h: any, i: number) => {
      console.log(`  假设${i + 1}: ${h.hypothesis}`);
      console.log(`    置信度: ${h.confidence}`);
      console.log(`    证据:`);
      h.evidence.forEach((e: string) => console.log(`      - ${e}`));
      if (h.reasoning) {
        console.log(`    推理: ${h.reasoning.substring(0, 100)}...`);
      }
      console.log();
    });

    // 显示推理链
    console.log('【第四步：构建推理链】');
    console.log(`  主要假设: ${result.reasoning.mainHypothesis}`);
    console.log(`  推理过程:`);
    console.log(`    ${result.reasoning.reasoning}`);
    console.log(`  反驳证据:`);
    console.log(`    ${result.reasoning.counterEvidence}`);
    console.log();

    // 显示洞察
    console.log('【第五步：形成洞察】');
    console.log(`  理解: ${result.insight.understanding}`);
    console.log(`  根本原因: ${result.insight.rootCause}`);
    console.log(`  可操作建议:`);
    console.log(`    ${result.insight.actionable}`);
    console.log();

    // 显示个性化回复
    console.log('【第六步：生成个性化回复】');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('启程老师的回复：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(result.response);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`⏱️  思考耗时: ${(elapsed / 1000).toFixed(2)}秒\n`);

    console.log('========================================');
    console.log('✅ Claude推理测试完成！');
    console.log('========================================\n');

    console.log('💡 核心特点：');
    console.log('  1. 使用Claude自己的推理能力，不依赖外部API');
    console.log('  2. 基于真实数据进行深度分析');
    console.log('  3. 理解"言外之意"，不是表面的关键词匹配');
    console.log('  4. 构建完整的推理链，可追溯验证');
    console.log('  5. 生成个性化的、有温度的回复\n');

    await pool.end();
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('\n详细错误:', error);
    await pool.end();
    process.exit(1);
  }
}

testClaudeReasoning();
