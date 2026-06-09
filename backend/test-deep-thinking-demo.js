#!/usr/bin/env node
/**
 * 深度思考启程老师 - 演示模式（不依赖API）
 * 展示系统架构和数据流，使用模拟的思考结果
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

async function demoTest() {
  console.log('========================================');
  console.log('深度思考启程老师 - 系统演示');
  console.log('（演示模式：使用模拟数据展示系统架构）');
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
    const studentName = students[0].nickname || '测试学生';

    console.log(`测试学生: ${studentName} (${studentId})\n`);

    // 场景：学生在任务中卡住了
    console.log('📝 场景：学生求助');
    console.log('学生说："这个需求太模糊了，我不知道客户到底要什么"\n');

    console.log('🧠 启程老师开始深度思考...\n');

    const startTime = Date.now();

    // 步骤1：记录观察
    console.log('【步骤1：观察层】记录学生行为...');
    await query(
      `INSERT INTO teacher_observations (
        student_id, behavior_type, context, emotional_state
      ) VALUES ($1, $2, $3, $4)`,
      [
        studentId,
        'seek_help',
        JSON.stringify({
          taskId: 'demo-task-id',
          studentMessage: '这个需求太模糊了，我不知道客户到底要什么',
          timeElapsed: 3600
        }),
        JSON.stringify({
          confidence: 0.4,
          frustration: 0.5,
          engagement: 0.8
        })
      ]
    );
    console.log('✓ 观察记录已保存\n');

    // 步骤2：模拟深度思考过程
    console.log('【步骤2：推理层】深度思考...');

    // 2.1 回忆
    console.log('  → 回忆相关信息...');
    const recentBehaviors = await query(
      `SELECT * FROM teacher_observations
       WHERE student_id = $1
       ORDER BY timestamp DESC
       LIMIT 5`,
      [studentId]
    );
    console.log(`    找到 ${recentBehaviors.length} 条最近行为记录`);

    const longTermMemory = await query(
      `SELECT * FROM teacher_long_term_memory WHERE student_id = $1`,
      [studentId]
    );
    console.log(`    长期记忆: ${longTermMemory[0]?.deep_understanding?.substring(0, 50)}...`);

    // 2.2 生成假设（模拟）
    console.log('  → 生成假设...');
    const hypotheses = [
      {
        hypothesis: '学生真的不理解需求',
        evidence: ['第一次求助', '表达困惑'],
        confidence: 0.3
      },
      {
        hypothesis: '学生想确认方向再动手',
        evidence: ['主动求助', '过去任务完成质量高'],
        confidence: 0.7
      },
      {
        hypothesis: '学生不适应抽象需求',
        evidence: ['说"太模糊"', '习惯具体需求'],
        confidence: 0.6
      }
    ];
    hypotheses.forEach((h, i) => {
      console.log(`    假设${i + 1}: ${h.hypothesis} (置信度: ${h.confidence})`);
    });

    // 2.3 推理（模拟）
    console.log('  → 推理验证...');
    const reasoning = {
      mainHypothesis: '学生想确认方向再动手',
      reasoning: '学生主动求助说明在意任务，过去表现良好说明有能力，"不知道"可能是想听老师确认',
      counterEvidence: '但也可能真的遇到了理解困难'
    };
    console.log(`    主要假设: ${reasoning.mainHypothesis}`);
    console.log(`    推理: ${reasoning.reasoning}`);

    // 2.4 形成洞察（模拟）
    console.log('  → 形成洞察...');
    const insight = {
      understanding: '学生不是能力不足，而是在新情况下寻求确认',
      rootCause: '从具体需求到抽象需求的适应期',
      actionable: '引导学生说出自己的理解，再确认方向'
    };
    console.log(`    理解: ${insight.understanding}`);
    console.log(`    根本原因: ${insight.rootCause}`);
    console.log(`    可操作建议: ${insight.actionable}\n`);

    // 保存思考记录
    await query(
      `INSERT INTO teacher_thinking_records (
        student_id, question, recall, hypotheses, reasoning, insight
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        studentId,
        '学生真正卡在哪里？如何引导他自己找到方向？',
        JSON.stringify({
          recentBehaviors: recentBehaviors.length,
          longTermMemory: longTermMemory[0]?.deep_understanding?.substring(0, 100)
        }),
        JSON.stringify(hypotheses),
        JSON.stringify(reasoning),
        JSON.stringify(insight)
      ]
    );

    // 步骤3：个性化表达（模拟）
    console.log('【步骤3：表达层】生成个性化回复...');
    const response = `我注意到你这次主动来问了——这很好，说明你在意这个任务。

你说"需求太模糊"，但我觉得你可能不是真的不懂。从你过去的表现来看，你的理解能力是很强的。这次的区别可能是，之前的需求比较具体，这次比较抽象。

我猜你不是不懂，而是想确认一下方向再动手，对吧？

那我们换个方式：你先别管客户怎么说，你自己看到这些关键词，脑子里第一个冒出来的画面是什么？先说出来，不用管对不对。`;

    console.log('✓ 回复生成完成\n');

    // 保存到短期记忆
    await query(
      `INSERT INTO teacher_short_term_memory (
        student_id, context, student_state, teacher_response
      ) VALUES ($1, $2, $3, $4)`,
      [
        studentId,
        JSON.stringify({
          situation: '学生在任务进行60分钟后求助',
          question: '学生真正卡在哪里？'
        }),
        '学生在任务进行60分钟后求助，说："这个需求太模糊了，我不知道客户到底要什么"',
        response
      ]
    );

    const elapsed = Date.now() - startTime;

    console.log('✅ 思考完成！\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('启程老师的回复：');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(response);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`⏱️  处理耗时: ${(elapsed / 1000).toFixed(2)}秒\n`);

    // 验证数据库记录
    console.log('🔍 验证数据库记录...\n');

    const thinkingRecords = await query(
      `SELECT * FROM teacher_thinking_records
       WHERE student_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [studentId]
    );

    if (thinkingRecords.length > 0) {
      const record = thinkingRecords[0];
      console.log('【思考记录】');
      console.log(`  问题: ${record.question}`);
      const hypotheses = typeof record.hypotheses === 'string' ? JSON.parse(record.hypotheses) : record.hypotheses;
      console.log(`  假设数量: ${hypotheses.length}`);
      const insight = typeof record.insight === 'string' ? JSON.parse(record.insight) : record.insight;
      console.log(`  洞察: ${insight.understanding}`);
    }

    const observations = await query(
      `SELECT * FROM teacher_observations
       WHERE student_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [studentId]
    );

    if (observations.length > 0) {
      console.log('\n【观察记录】');
      console.log(`  行为类型: ${observations[0].behavior_type}`);
      const emotion = typeof observations[0].emotional_state === 'string' ?
        JSON.parse(observations[0].emotional_state) : observations[0].emotional_state;
      console.log(`  推断情绪: 信心${emotion.confidence} 挫折${emotion.frustration} 投入${emotion.engagement}`);
    }

    const memories = await query(
      `SELECT * FROM teacher_short_term_memory
       WHERE student_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [studentId]
    );

    if (memories.length > 0) {
      console.log('\n【短期记忆】');
      console.log(`  已保存回复: ${memories[0].teacher_response.substring(0, 50)}...`);
    }

    console.log('\n========================================');
    console.log('✅ 系统演示完成！');
    console.log('========================================\n');

    console.log('📊 系统架构验证：');
    console.log('  ✓ 观察层：成功记录学生行为和情绪状态');
    console.log('  ✓ 推理层：完成回忆→假设→推理→洞察的完整流程');
    console.log('  ✓ 表达层：生成个性化、有温度的回复');
    console.log('  ✓ 记忆层：保存思考记录和短期记忆');
    console.log('\n💡 说明：');
    console.log('  - 当前使用模拟数据展示系统架构');
    console.log('  - 配置正确的API后，推理和表达将由Claude生成');
    console.log('  - 数据库记录、观察、记忆功能已完全实现\n');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ 演示失败:', error.message);
    console.error('\n详细错误:', error);
    await pool.end();
    process.exit(1);
  }
}

demoTest();
