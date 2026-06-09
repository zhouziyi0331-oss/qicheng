#!/usr/bin/env ts-node
/**
 * 深度思考启程老师 - 真实API测试（TypeScript版本）
 */

import dotenv from 'dotenv';
import { Pool } from 'pg';
import deepThinkingTeacher from './src/services/deepThinkingTeacherService';

dotenv.config();

// 检查API配置
if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sk-ant-api03-...') {
  console.error('❌ 错误：ANTHROPIC_API_KEY 未配置');
  console.log('\n请先配置API密钥：');
  console.log('1. 编辑 .env 文件');
  console.log('2. 添加：ANTHROPIC_API_KEY=sk-ant-api03-xxxxx');
  console.log('3. 获取密钥：https://console.anthropic.com/\n');
  process.exit(1);
}

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

async function realTest() {
  console.log('========================================');
  console.log('深度思考启程老师 - 真实场景测试');
  console.log('========================================\n');

  try {
    // 获取一个真实学生
    const students = await query(
      "SELECT id, nickname FROM users WHERE role='student' LIMIT 1"
    );

    if (students.length === 0) {
      console.log('❌ 没有找到学生数据');
      process.exit(1);
    }

    const studentId = students[0].id;
    const studentName = students[0].nickname;

    console.log(`测试学生: ${studentName} (${studentId})\n`);

    // 场景：学生在任务中卡住了
    console.log('📝 场景：学生求助');
    console.log('学生说："这个需求太模糊了，我不知道客户到底要什么"\n');

    console.log('🧠 启程老师开始深度思考...\n');

    const startTime = Date.now();

    const response = await deepThinkingTeacher.onStudentStuck(
      studentId,
      'test-task-id',
      '这个需求太模糊了，我不知道客户到底要什么',
      3600  // 已经尝试了1小时
    );

    const elapsed = Date.now() - startTime;

    console.log('✅ 思考完成！\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('启程老师的回复：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(response);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`⏱️  思考耗时: ${(elapsed / 1000).toFixed(2)}秒\n`);

    // 查看思考记录
    console.log('🔍 查看思考过程...\n');

    const thinkingRecords = await query(
      `SELECT question, insight, reasoning, hypotheses
       FROM teacher_thinking_records
       WHERE student_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [studentId]
    );

    if (thinkingRecords.length > 0) {
      const record = thinkingRecords[0];
      console.log('【问题】', record.question);
      console.log();

      if (record.hypotheses) {
        const hypotheses = typeof record.hypotheses === 'string' ?
          JSON.parse(record.hypotheses) : record.hypotheses;
        console.log('【假设】');
        hypotheses.forEach((h: any, i: number) => {
          console.log(`  ${i + 1}. ${h.hypothesis} (置信度: ${h.confidence})`);
        });
        console.log();
      }

      if (record.reasoning) {
        const reasoning = typeof record.reasoning === 'string' ?
          JSON.parse(record.reasoning) : record.reasoning;
        console.log('【推理】');
        console.log('  主要假设:', reasoning.mainHypothesis);
        console.log('  推理过程:', reasoning.reasoning);
        console.log();
      }

      if (record.insight) {
        const insight = typeof record.insight === 'string' ?
          JSON.parse(record.insight) : record.insight;
        console.log('【洞察】');
        console.log('  理解:', insight.understanding);
        console.log('  根本原因:', insight.rootCause);
        console.log('  可操作建议:', insight.actionable);
        console.log();
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 查看观察记录
    const observations = await query(
      `SELECT behavior_type, context, emotional_state, timestamp
       FROM teacher_observations
       WHERE student_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [studentId]
    );

    if (observations.length > 0) {
      console.log('📊 观察记录:');
      console.log('  行为:', observations[0].behavior_type);
      console.log('  时间:', observations[0].timestamp);
      if (observations[0].emotional_state) {
        const emotion = typeof observations[0].emotional_state === 'string' ?
          JSON.parse(observations[0].emotional_state) : observations[0].emotional_state;
        console.log('  推断情绪:');
        console.log('    - 信心:', emotion.confidence);
        console.log('    - 挫折感:', emotion.frustration);
        console.log('    - 投入度:', emotion.engagement);
      }
    }

    console.log('\n========================================');
    console.log('✅ 测试成功！系统真的在思考！');
    console.log('========================================\n');

    await pool.end();
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('\n详细错误:', error);
    await pool.end();
    process.exit(1);
  }
}

realTest();
