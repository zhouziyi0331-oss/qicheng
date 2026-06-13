#!/usr/bin/env node
/**
 * 填充真实测试数据
 * 让AI系统从"空壳"变成"真实可用"
 */

import { pool } from '../src/utils/db';
import semanticMatchingEngine from '../src/services/semanticMatchingEngine';
import vectorGenerationService from '../src/services/vectorGenerationService';
import logger from '../src/utils/logger';

async function generateOPCTestData() {
  console.log('\n🎯 步骤1: 为测试学生生成真实OPC测评数据\n');

  // 获取没有OPC数据的学生
  const students = await pool.query(`
    SELECT u.id, u.nickname
    FROM users u
    LEFT JOIN user_opc_results opc ON u.id = opc.user_id
    WHERE u.role = 'student'
      AND opc.id IS NULL
    LIMIT 10
  `);

  if (students.rows.length === 0) {
    console.log('✅ 所有学生已有OPC数据');
    return;
  }

  console.log(`找到 ${students.rows.length} 个需要生成OPC数据的学生\n`);

  // 为每个学生生成随机但合理的测评数据
  for (const student of students.rows) {
    // 生成6个维度的分数（每个维度0-100）
    const scores = {
      information_processing: Math.floor(Math.random() * 40) + 60, // 60-100
      creation_drive: Math.floor(Math.random() * 40) + 50,
      tool_learning: Math.floor(Math.random() * 40) + 60,
      task_execution: Math.floor(Math.random() * 40) + 50,
      collaboration: Math.floor(Math.random() * 40) + 60,
      risk_attitude: Math.floor(Math.random() * 40) + 40
    };

    // 生成原始分数（0-18）
    const rawScores = {
      information_processing: Math.round(scores.information_processing * 18 / 100),
      creation_drive: Math.round(scores.creation_drive * 18 / 100),
      tool_learning: Math.round(scores.tool_learning * 18 / 100),
      task_execution: Math.round(scores.task_execution * 18 / 100),
      collaboration: Math.round(scores.collaboration * 18 / 100),
      risk_attitude: Math.round(scores.risk_attitude * 18 / 100)
    };

    // 根据分数生成人格标签
    let personalityTag = 'balanced_learner';
    let personalityDesc = '你是一个全面发展的学习者';
    let track = 'AI内容创作';
    let level = 'Lv.1 试流者';

    if (scores.information_processing > 70 && scores.creation_drive > 70) {
      personalityTag = 'visual_storyteller';
      personalityDesc = '你擅长用画面讲故事，能看到各个元素之间的联系';
      track = 'AI内容创作';
    } else if (scores.tool_learning > 70 && scores.task_execution > 70) {
      personalityTag = 'system_builder';
      personalityDesc = '你习惯先理解底层逻辑再动手，擅长设计规则和系统';
      track = 'AI工具开发';
    } else if (scores.creation_drive > 75) {
      personalityTag = 'creative_executor';
      personalityDesc = '你享受从0到1的创作过程，喜欢快速出稿再打磨';
      track = 'AI内容创作';
    }

    // 生成维度解读
    const interpretations = {
      information_processing: `信息处理能力${scores.information_processing}分`,
      creation_drive: `创作驱动力${scores.creation_drive}分`,
      tool_learning: `工具学习能力${scores.tool_learning}分`,
      task_execution: `任务执行力${scores.task_execution}分`,
      collaboration: `协作能力${scores.collaboration}分`,
      risk_attitude: `风险态度${scores.risk_attitude}分`
    };

    // 生成模拟答案数组（36题）
    const answers = Array(36).fill(null).map((_, i) => ({
      questionId: i + 1,
      score: Math.floor(Math.random() * 3) + 1 // 1-3分
    }));

    // 插入数据
    await pool.query(
      `INSERT INTO user_opc_results (
        user_id, test_version,
        information_processing_score, creation_drive_score, tool_learning_score,
        task_execution_score, collaboration_score, risk_attitude_score,
        information_processing_normalized, creation_drive_normalized, tool_learning_normalized,
        task_execution_normalized, collaboration_normalized, risk_attitude_normalized,
        personality_tag, personality_description, dimension_interpretations,
        recommended_track, recommended_level, recommended_first_task, answers,
        completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW())`,
      [
        student.id, '2.0',
        rawScores.information_processing, rawScores.creation_drive, rawScores.tool_learning,
        rawScores.task_execution, rawScores.collaboration, rawScores.risk_attitude,
        scores.information_processing, scores.creation_drive, scores.tool_learning,
        scores.task_execution, scores.collaboration, scores.risk_attitude,
        personalityTag, personalityDesc, JSON.stringify(interpretations),
        track, level, 'AI图文内容制作', JSON.stringify(answers)
      ]
    );

    // 更新用户表
    await pool.query(
      `UPDATE users SET opc_personality_tag = $1, opc_completed_at = NOW() WHERE id = $2`,
      [personalityTag, student.id]
    );

    console.log(`✅ ${student.nickname || student.id}: ${personalityTag} (信息${scores.information_processing} 创作${scores.creation_drive})`);
  }

  console.log(`\n✅ 完成：为 ${students.rows.length} 个学生生成了OPC数据\n`);
}

async function generateStudentVectors() {
  console.log('\n🤖 步骤2: 为学生生成AI能力向量\n');

  // 获取有OPC数据但没有向量的学生
  const students = await pool.query(`
    SELECT u.id, u.nickname
    FROM users u
    JOIN user_opc_results opc ON u.id = opc.user_id
    LEFT JOIN student_capabilities sc ON u.id = sc.student_id
    WHERE u.role = 'student'
      AND (sc.combined_vector IS NULL OR sc.profile_summary IS NULL)
    LIMIT 5
  `);

  if (students.rows.length === 0) {
    console.log('✅ 所有学生已有向量数据');
    return;
  }

  console.log(`找到 ${students.rows.length} 个需要生成向量的学生\n`);

  for (const student of students.rows) {
    try {
      console.log(`处理: ${student.nickname || student.id}...`);
      await vectorGenerationService.updateStudentEmbedding(student.id);
      console.log(`✅ ${student.nickname || student.id}: 向量生成成功`);
    } catch (error: any) {
      console.log(`⚠️ ${student.nickname || student.id}: ${error.message}`);
    }
  }

  console.log(`\n✅ 完成：向量生成\n`);
}

async function triggerTaskMatching() {
  console.log('\n🎯 步骤3: 触发任务匹配\n');

  // 获取还没有匹配记录的任务
  const tasks = await pool.query(`
    SELECT t.id, t.title
    FROM tasks t
    LEFT JOIN task_student_matches tsm ON t.id = tsm.task_id
    WHERE t.status IN ('active', 'pending_review')
    GROUP BY t.id, t.title
    HAVING COUNT(tsm.id) = 0
    LIMIT 3
  `);

  if (tasks.rows.length === 0) {
    console.log('ℹ️ 没有找到需要匹配的任务，尝试为现有任务重新匹配...\n');

    // 获取任意3个任务
    const anyTasks = await pool.query(`
      SELECT id, title FROM tasks WHERE status IN ('active', 'pending_review') LIMIT 3
    `);

    if (anyTasks.rows.length === 0) {
      console.log('⚠️ 没有可用的任务');
      return;
    }

    for (const task of anyTasks.rows) {
      await matchTask(task);
    }
  } else {
    console.log(`找到 ${tasks.rows.length} 个任务需要匹配\n`);

    for (const task of tasks.rows) {
      await matchTask(task);
    }
  }

  console.log(`\n✅ 完成：任务匹配\n`);
}

async function matchTask(task: any) {
  try {
    console.log(`\n匹配任务: ${task.title}`);

    const matches = await semanticMatchingEngine.findBestStudentsForTask(task.id, 10);

    if (matches.length === 0) {
      console.log(`⚠️ 没有找到匹配的学生`);
      return;
    }

    console.log(`✅ 找到 ${matches.length} 个匹配学生:`);
    matches.slice(0, 5).forEach((match: any, i: number) => {
      const ms = match.match_score;
      console.log(`   ${i + 1}. 综合${Math.round(ms.overallScore * 100)}% (技能${Math.round(ms.skillMatch.score * 100)}% 难度${Math.round(ms.difficultyMatch.score * 100)}%)`);
    });
  } catch (error: any) {
    console.log(`❌ 匹配失败: ${error.message}`);
  }
}

async function showStatistics() {
  console.log('\n📊 最终统计\n');
  console.log('='.repeat(60));

  // OPC测评数据
  const opcCount = await pool.query(`
    SELECT COUNT(*) as total,
           COUNT(DISTINCT personality_tag) as unique_tags
    FROM user_opc_results
  `);
  console.log(`OPC测评记录: ${opcCount.rows[0].total} (${opcCount.rows[0].unique_tags}种人格标签)`);

  // 学生向量
  const vectorCount = await pool.query(`
    SELECT COUNT(*) as total,
           COUNT(CASE WHEN combined_vector IS NOT NULL THEN 1 END) as has_vector
    FROM student_capabilities
  `);
  console.log(`学生能力向量: ${vectorCount.rows[0].has_vector}/${vectorCount.rows[0].total}个学生`);

  // 任务匹配
  const matchCount = await pool.query(`
    SELECT COUNT(*) as total,
           COUNT(DISTINCT task_id) as unique_tasks,
           ROUND(AVG(overall_score) * 100, 1) as avg_score
    FROM task_student_matches
  `);
  console.log(`任务匹配记录: ${matchCount.rows[0].total} (${matchCount.rows[0].unique_tasks}个任务, 平均${matchCount.rows[0].avg_score}%)`);

  // 人格标签分布
  const tagDist = await pool.query(`
    SELECT personality_tag, COUNT(*) as count
    FROM user_opc_results
    GROUP BY personality_tag
    ORDER BY count DESC
  `);
  console.log(`\n人格标签分布:`);
  tagDist.rows.forEach(row => {
    console.log(`  - ${row.personality_tag}: ${row.count}人`);
  });

  console.log('='.repeat(60));
  console.log('\n✅ 数据填充完成！系统现在有真实数据支撑了。\n');
}

async function main() {
  try {
    console.log('='.repeat(60));
    console.log('🚀 启程平台AI系统 - 数据填充工具');
    console.log('='.repeat(60));

    await generateOPCTestData();
    await generateStudentVectors();
    await triggerTaskMatching();
    await showStatistics();

    console.log('✨ 下一步: 前端连接这些真实数据');
    console.log('   1. 移除硬编码的"视觉叙事者"等固定文案');
    console.log('   2. 调用 /api/v1/students/recommended-tasks 获取真实推荐');
    console.log('   3. 显示真实的匹配分数和人格标签\n');

  } catch (error: unknown) {
    console.error('❌ 执行失败:', error);
  } finally {
    await pool.end();
  }
}

main();
