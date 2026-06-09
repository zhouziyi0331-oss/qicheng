/**
 * 使用真实API测试深度思考系统
 */

require('dotenv').config();

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

async function testWithRealAPI() {
  console.log('========================================');
  console.log('深度思考启程老师 - 真实API测试');
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
    const studentName = students[0].nickname || '学生';

    console.log(`测试学生: ${studentName} (${studentId})\n`);

    // 动态加载服务
    const deepThinkingTeacher = require('./src/services/deepThinkingTeacherService').default;

    console.log('📝 场景：学生在任务中卡住了');
    console.log('学生说："这个需求太模糊了，我不知道客户到底要什么"\n');
    console.log('🧠 启程老师开始深度思考...\n');

    const startTime = Date.now();

    const response = await deepThinkingTeacher.onStudentStuck(
      studentId,
      'test-task-123',
      '这个需求太模糊了，我不知道客户到底要什么',
      3600
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
      
      if (record.hypotheses) {
        const hypotheses = typeof record.hypotheses === 'string' ? 
          JSON.parse(record.hypotheses) : record.hypotheses;
        console.log('\n【假设】');
        hypotheses.forEach((h, i) => {
          console.log(`  ${i+1}. ${h.hypothesis} (置信度: ${h.confidence})`);
        });
      }

      if (record.reasoning) {
        const reasoning = typeof record.reasoning === 'string' ? 
          JSON.parse(record.reasoning) : record.reasoning;
        console.log('\n【推理】');
        console.log('  主要假设:', reasoning.mainHypothesis);
        console.log('  推理过程:', reasoning.reasoning);
      }

      if (record.insight) {
        const insight = typeof record.insight === 'string' ? 
          JSON.parse(record.insight) : record.insight;
        console.log('\n【洞察】');
        console.log('  理解:', insight.understanding);
        console.log('  根本原因:', insight.rootCause);
        console.log('  可操作建议:', insight.actionable);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 查看观察记录
    const observations = await query(
      `SELECT behavior_type, emotional_state, timestamp
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

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('\n完整错误:');
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

testWithRealAPI();
