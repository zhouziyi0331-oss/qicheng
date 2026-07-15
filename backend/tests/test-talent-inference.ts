#!/usr/bin/env ts-node

/**
 * 测试天赋推断功能
 *
 * 直接调用服务层，不需要认证
 */

import { TalentTagInferenceService } from '../src/services/talentTagInferenceService';

async function testTalentInference() {
  console.log('🧪 测试天赋推断功能\n');

  const testStudentId = '99999999-9999-9999-9999-999999999999';

  // OPC分数和倾向（使用数据库中的实际值）
  const opcScores = {
    info_processing_score: 80,
    info_processing_tendency: 'integrative',  // 整合型思维
    creation_drive_score: 33,
    creation_drive_tendency: 'logical',       // 逻辑型
    tool_learning_score: 69,
    tool_learning_tendency: 'exploratory',    // 探索型学习
    task_execution_score: 18,
    task_execution_tendency: 'iterative',     // 迭代型执行
    collaboration_score: 83,
    collaboration_tendency: 'collaborative',  // 协作型
    risk_attitude_score: 100,
    risk_attitude_tendency: 'adventurous'     // 冒险型
  };

  console.log('📊 OPC分数:');
  console.log(`  信息加工: ${opcScores.info_processing_score}`);
  console.log(`  创造驱动: ${opcScores.creation_drive_score}`);
  console.log(`  工具学习: ${opcScores.tool_learning_score}`);
  console.log(`  任务执行: ${opcScores.task_execution_score}`);
  console.log(`  协作: ${opcScores.collaboration_score}`);
  console.log(`  风险态度: ${opcScores.risk_attitude_score}\n`);

  try {
    console.log('🔄 开始推断天赋标签...\n');

    await TalentTagInferenceService.inferFromOPC(
      testStudentId,
      opcScores
    );

    console.log('✅ 推断完成！\n');

    // 验证数据库中是否保存
    const { pool } = await import('../src/config/database');

    const talentsResult = await pool.query(
      `SELECT tt.tag_name, tt.category, stt.strength, stt.confidence
       FROM student_talent_tags stt
       JOIN talent_tags tt ON stt.tag_id = tt.id
       WHERE stt.student_id = $1
       ORDER BY stt.confidence DESC`,
      [testStudentId]
    );

    console.log(`📌 推断出 ${talentsResult.rows.length} 个天赋标签:\n`);

    talentsResult.rows.forEach((talent: any, index: number) => {
      console.log(`${index + 1}. ${talent.tag_name} (${talent.category})`);
      console.log(`   强度: ${talent.strength}`);
      console.log(`   置信度: ${(parseFloat(talent.confidence) * 100).toFixed(1)}%\n`);
    });

    console.log(`✅ 数据库验证: 保存了 ${talentsResult.rows.length} 条天赋标签记录`);

    await pool.end();

  } catch (error: any) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testTalentInference();
