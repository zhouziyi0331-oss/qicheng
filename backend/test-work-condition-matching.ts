/**
 * 工作条件匹配系统测试脚本
 * 测试完整流程：OPC测试 → 工作条件画像 → 任务需求画像 → 智能匹配
 */

import { pool } from './src/utils/db';
import opcAnalysisService from './src/services/opcAnalysisService';
import projectAnalysisService from './src/services/projectAnalysisService';
import workConditionMatchingEngine from './src/services/workConditionMatchingEngine';

// 模拟OPC测试结果
const mockOPCAnswers = {
  // 信息接收维度 (6题)
  q1: 'B', // 整合型：先看整体框架
  q2: 'B', // 整合型：理解各部分联系
  q3: 'B', // 整合型：从整体到细节
  q4: 'A', // 拆解型：逐个击破
  q5: 'B', // 整合型：先建立全局认知
  q6: 'B', // 整合型：理解背后逻辑

  // 创作驱动维度 (6题)
  q7: 'A', // 视觉型：看到好看的设计
  q8: 'A', // 视觉型：视觉冲击力
  q9: 'A', // 视觉型：色彩和构图
  q10: 'B', // 逻辑型：解决问题
  q11: 'A', // 视觉型：视觉元素
  q12: 'A', // 视觉型：美感

  // 学习切入维度 (6题)
  q13: 'A', // 探索型：直接上手试
  q14: 'A', // 探索型：边做边学
  q15: 'B', // 手册型：先看文档
  q16: 'A', // 探索型：立刻开始
  q17: 'A', // 探索型：试错中学习
  q18: 'A', // 探索型：动手实践

  // 执行节奏维度 (6题)
  q19: 'B', // 迭代型：先出快速版本
  q20: 'B', // 迭代型：概念稿→反馈→细化
  q21: 'A', // 规划型：详细计划
  q22: 'B', // 迭代型：快速迭代
  q23: 'B', // 迭代型：先做出来再优化
  q24: 'B', // 迭代型：看到方向

  // 自主度维度 (6题)
  q25: 'A', // 独立型：独立完成
  q26: 'A', // 独立型：自己负责
  q27: 'B', // 协作型：团队协作
  q28: 'A', // 独立型：给方向后放手
  q29: 'A', // 独立型：独立决策
  q30: 'A', // 独立型：自主推进

  // 风险容忍维度 (8题)
  q31: 'B', // 冒险型：接受挑战
  q32: 'A', // 稳健型：先评估可行性
  q33: 'B', // 冒险型：愿意尝试
  q34: 'A', // 稳健型：有参考案例
  q35: 'B', // 冒险型：探索新方向
  q36: 'A', // 稳健型：明确成功标准
  q37: 'B', // 冒险型：接受不确定性
  q38: 'A'  // 稳健型：稳妥方案
};

const mockOPCScores = {
  openness: 75,
  persistence: 70,
  creativity: 80,
  informationProcessing: 75, // 整合型
  creationDrive: 80, // 视觉型
  learningStyle: 70, // 探索型
  executionRhythm: 35, // 迭代型
  collaborationStyle: 30, // 独立型
  riskAttitude: 55 // 中等冒险
};

// 模拟任务信息
const mockTaskInfo = {
  taskId: 'test-task-001',
  title: '品牌视觉升级项目',
  description: `
    我们是一家新消费品牌，需要对品牌视觉进行全面升级。

    项目背景：
    - 已有品牌手册和VI规范
    - 有明确的参考案例（附件中有3个竞品案例）
    - 需要保持品牌调性的一致性

    交付物：
    - 品牌主视觉设计
    - 社交媒体内容模板
    - 产品包装设计方案

    工作方式：
    - 建议先出概念稿，确认方向后再深化
    - 我们会在关键节点给反馈，日常执行由你独立完成
    - 接受迭代优化的工作方式
  `,
  deliverableType: '视觉设计',
  cycle: 21, // 3周
  budget: 8000,
  hasReference: true,
  clientCommunicationStyle: '适度'
};

async function testWorkConditionMatching() {
  console.log('='.repeat(60));
  console.log('工作条件匹配系统测试');
  console.log('='.repeat(60));
  console.log();

  try {
    // 1. 生成学生工作条件画像
    console.log('【步骤1】生成学生工作条件画像');
    console.log('-'.repeat(60));

    const studentId = 'test-student-001';
    const studentProfile = await opcAnalysisService.generateWorkConditionProfile({
      studentId,
      answers: mockOPCAnswers,
      scores: mockOPCScores
    });

    console.log('\n✅ 学生工作条件画像生成成功！\n');
    console.log('【信息接收偏好】');
    console.log(`  偏好: ${studentProfile.informationReception.preference}`);
    console.log(`  理想条件: ${studentProfile.informationReception.idealCondition}`);
    console.log(`  不适合条件: ${studentProfile.informationReception.unsuitableCondition}`);

    console.log('\n【创作驱动】');
    console.log(`  来源: ${studentProfile.creationDrive.source}`);
    console.log(`  动力: ${studentProfile.creationDrive.motivation}`);
    console.log(`  适合项目: ${studentProfile.creationDrive.projectType}`);

    console.log('\n【学习切入】');
    console.log(`  风格: ${studentProfile.learningApproach.style}`);
    console.log(`  理想起点: ${studentProfile.learningApproach.idealStart}`);

    console.log('\n【执行节奏】');
    console.log(`  模式: ${studentProfile.executionRhythm.pattern}`);
    console.log(`  理想周期: ${studentProfile.executionRhythm.idealCycle}`);

    console.log('\n【自主度需求】');
    console.log(`  水平: ${studentProfile.autonomyNeed.level}`);
    console.log(`  理想协作: ${studentProfile.autonomyNeed.idealCollaboration}`);

    console.log('\n【风险容忍度】');
    console.log(`  态度: ${studentProfile.riskTolerance.attitude}`);
    console.log(`  理想挑战: ${studentProfile.riskTolerance.idealChallenge}`);

    console.log('\n【核心优势】');
    studentProfile.coreStrengths.forEach((strength, i) => {
      console.log(`  ${i + 1}. ${strength}`);
    });

    console.log('\n【画像文本】');
    console.log(`  ${studentProfile.profileText}`);

    // 保存学生画像（测试环境，实际会在OPC测试完成时自动保存）
    await opcAnalysisService.saveWorkConditionProfile(studentProfile);
    console.log('\n✅ 学生画像已保存到数据库');

    // 2. 生成任务需求条件画像
    console.log('\n\n【步骤2】生成任务需求条件画像');
    console.log('-'.repeat(60));

    const taskProfile = await projectAnalysisService.generateRequirementProfile(mockTaskInfo);

    console.log('\n✅ 任务需求条件画像生成成功！\n');
    console.log('【信息接收需求】');
    console.log(`  条件: ${taskProfile.informationReceptionNeed.condition}`);
    console.log(`  要求: ${taskProfile.informationReceptionNeed.requirement}`);

    console.log('\n【创作驱动需求】');
    console.log(`  产出类型: ${taskProfile.creationDriveNeed.outputType}`);
    console.log(`  要求: ${taskProfile.creationDriveNeed.requirement}`);

    console.log('\n【学习切入需求】');
    console.log(`  起点: ${taskProfile.learningApproachNeed.startingPoint}`);
    console.log(`  要求: ${taskProfile.learningApproachNeed.requirement}`);

    console.log('\n【执行节奏需求】');
    console.log(`  周期: ${taskProfile.executionRhythmNeed.cycle}`);
    console.log(`  灵活度: ${taskProfile.executionRhythmNeed.flexibility}`);
    console.log(`  要求: ${taskProfile.executionRhythmNeed.requirement}`);

    console.log('\n【自主度需求】');
    console.log(`  沟通频率: ${taskProfile.autonomyNeed.communicationFrequency}`);
    console.log(`  要求: ${taskProfile.autonomyNeed.requirement}`);

    console.log('\n【风险水平】');
    console.log(`  确定性: ${taskProfile.riskLevel.certainty}`);
    console.log(`  要求: ${taskProfile.riskLevel.requirement}`);

    console.log('\n【项目类型】');
    console.log(`  ${taskProfile.projectType}`);

    console.log('\n【需求文本】');
    console.log(`  ${taskProfile.requirementText}`);

    // 保存任务画像
    await projectAnalysisService.saveRequirementProfile(taskProfile);
    console.log('\n✅ 任务画像已保存到数据库');

    // 3. 执行智能匹配
    console.log('\n\n【步骤3】执行工作条件智能匹配');
    console.log('-'.repeat(60));

    const matchResult = await workConditionMatchingEngine.matchStudentWithTask(
      studentId,
      mockTaskInfo.taskId
    );

    console.log('\n✅ 匹配分析完成！\n');
    console.log('【整体匹配度】');
    console.log(`  等级: ${matchResult.overallFit}`);
    console.log(`  分数: ${(matchResult.fitScore * 100).toFixed(1)}%`);

    console.log('\n【六维度匹配详情】');
    const dimensions = [
      { key: 'informationReception', name: '信息接收' },
      { key: 'creationDrive', name: '创作驱动' },
      { key: 'learningApproach', name: '学习切入' },
      { key: 'executionRhythm', name: '执行节奏' },
      { key: 'autonomy', name: '自主度' },
      { key: 'riskTolerance', name: '风险容忍' }
    ];

    dimensions.forEach(dim => {
      const match = (matchResult.dimensionMatches as any)[dim.key];
      const icon = match.match ? '✅' : '⚠️';
      console.log(`\n  ${icon} ${dim.name}: ${(match.score * 100).toFixed(0)}%`);
      console.log(`     ${match.reason}`);
    });

    console.log('\n【匹配亮点】');
    matchResult.matchPoints.forEach((point, i) => {
      console.log(`  ✨ ${i + 1}. ${point}`);
    });

    if (matchResult.frictionPoints && matchResult.frictionPoints.length > 0) {
      console.log('\n【潜在摩擦点】');
      matchResult.frictionPoints.forEach((point, i) => {
        console.log(`  ⚠️  ${i + 1}. ${point}`);
      });
    }

    if (matchResult.adjustmentSuggestions && matchResult.adjustmentSuggestions.length > 0) {
      console.log('\n【调整建议】');
      matchResult.adjustmentSuggestions.forEach((suggestion, i) => {
        console.log(`  💡 ${i + 1}. ${suggestion}`);
      });
    }

    console.log('\n【推荐理由（学生视角）】');
    console.log(`  ${matchResult.recommendationForStudent}`);

    console.log('\n【推荐理由（企业视角）】');
    console.log(`  ${matchResult.recommendationForCompany}`);

    // 4. 保存匹配结果
    console.log('\n\n【步骤4】保存匹配结果到数据库');
    console.log('-'.repeat(60));

    await pool.query(
      `INSERT INTO work_condition_matches (
        task_id, student_id, overall_fit, fit_score,
        dimension_matches, match_points, friction_points,
        adjustment_suggestions, recommendation_for_student,
        recommendation_for_company, vector_similarity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (task_id, student_id) DO UPDATE SET
        overall_fit = EXCLUDED.overall_fit,
        fit_score = EXCLUDED.fit_score,
        dimension_matches = EXCLUDED.dimension_matches,
        match_points = EXCLUDED.match_points,
        friction_points = EXCLUDED.friction_points,
        adjustment_suggestions = EXCLUDED.adjustment_suggestions,
        recommendation_for_student = EXCLUDED.recommendation_for_student,
        recommendation_for_company = EXCLUDED.recommendation_for_company`,
      [
        mockTaskInfo.taskId,
        studentId,
        matchResult.overallFit,
        matchResult.fitScore,
        JSON.stringify(matchResult.dimensionMatches),
        matchResult.matchPoints,
        matchResult.frictionPoints || [],
        matchResult.adjustmentSuggestions || [],
        matchResult.recommendationForStudent,
        matchResult.recommendationForCompany,
        0.0
      ]
    );

    console.log('\n✅ 匹配结果已保存到数据库');

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ 测试完成！工作条件匹配系统运行正常');
    console.log('='.repeat(60));
    console.log('\n核心价值：');
    console.log('  1. ✅ 基于OPC测试的深度画像生成');
    console.log('  2. ✅ 六维度工作条件智能匹配');
    console.log('  3. ✅ 可解释的匹配理由生成');
    console.log('  4. ✅ 匹配"工作模式"而非"技能标签"');
    console.log();

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// 运行测试
testWorkConditionMatching().catch(console.error);
