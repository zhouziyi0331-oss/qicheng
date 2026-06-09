import { Request, Response, NextFunction } from 'express';
import { queryOne, query } from '../../utils/db';
import { AppError } from '../../middleware/errorHandler';

// ============================================================
// GET /student/test/result
// 获取学生的OPC测试结果
// ============================================================
export async function getTestResult(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    // 查询最新的测试结果
    const result = await queryOne<{
      id: string;
      test_version: string;
      information_processing_score: number;
      creation_drive_score: number;
      tool_learning_score: number;
      task_execution_score: number;
      collaboration_score: number;
      risk_attitude_score: number;
      information_processing_normalized: number;
      creation_drive_normalized: number;
      tool_learning_normalized: number;
      task_execution_normalized: number;
      collaboration_normalized: number;
      risk_attitude_normalized: number;
      personality_tag: string;
      personality_description: string;
      dimension_interpretations: Record<string, unknown>;
      recommended_track: string;
      recommended_level: string;
      recommended_first_task: string;
      answers: Array<{ question_number: number; answer: string; score: number }>;
      completed_at: Date;
    }>(
      `SELECT id, test_version,
              information_processing_score, creation_drive_score, tool_learning_score,
              task_execution_score, collaboration_score, risk_attitude_score,
              information_processing_normalized, creation_drive_normalized, tool_learning_normalized,
              task_execution_normalized, collaboration_normalized, risk_attitude_normalized,
              personality_tag, personality_description, dimension_interpretations,
              recommended_track, recommended_level, recommended_first_task,
              answers, completed_at
       FROM user_opc_results
       WHERE user_id = $1
       ORDER BY completed_at DESC
       LIMIT 1`,
      [userId]
    );

    if (!result) {
      throw new AppError(404, '未找到测试结果，请先完成OPC测试', 'TEST_NOT_COMPLETED');
    }

    // 构建六维得分对象
    const sixDimensions = {
      information_processing: {
        name: '信息处理',
        rawScore: result.information_processing_score,
        normalizedScore: result.information_processing_normalized,
      },
      creation_drive: {
        name: '创作驱动',
        rawScore: result.creation_drive_score,
        normalizedScore: result.creation_drive_normalized,
      },
      tool_learning: {
        name: '工具学习',
        rawScore: result.tool_learning_score,
        normalizedScore: result.tool_learning_normalized,
      },
      task_execution: {
        name: '任务执行',
        rawScore: result.task_execution_score,
        normalizedScore: result.task_execution_normalized,
      },
      collaboration: {
        name: '协作倾向',
        rawScore: result.collaboration_score,
        normalizedScore: result.collaboration_normalized,
      },
      risk_attitude: {
        name: '风险态度',
        rawScore: result.risk_attitude_score,
        normalizedScore: result.risk_attitude_normalized,
      },
    };

    res.json({
      success: true,
      data: {
        testId: result.id,
        testVersion: result.test_version,
        completedAt: result.completed_at,
        personalityTag: result.personality_tag,
        personalityDescription: result.personality_description,
        sixDimensions,
        dimensionInterpretations: result.dimension_interpretations,
        recommendations: {
          track: result.recommended_track,
          level: result.recommended_level,
          firstTask: result.recommended_first_task,
        },
        answers: result.answers,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// GET /opc/report/:userId
// 生成或获取用户的OPC详细报告
// ============================================================
export async function getOpcReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    const requesterId = req.user!.userId;

    // 权限检查：只能查看自己的报告，或管理员可以查看所有报告
    if (requesterId !== userId && req.user!.role !== 'admin') {
      throw new AppError(403, '无权查看该用户的报告', 'FORBIDDEN');
    }

    // 查询测试结果
    const testResult = await queryOne<{
      id: string;
      test_version: string;
      personality_tag: string;
      personality_description: string;
      dimension_interpretations: Record<string, unknown>;
      recommended_track: string;
      recommended_level: string;
      recommended_first_task: string;
      information_processing_normalized: number;
      creation_drive_normalized: number;
      tool_learning_normalized: number;
      task_execution_normalized: number;
      collaboration_normalized: number;
      risk_attitude_normalized: number;
      completed_at: Date;
    }>(
      `SELECT id, test_version, personality_tag, personality_description,
              dimension_interpretations, recommended_track, recommended_level, recommended_first_task,
              information_processing_normalized, creation_drive_normalized, tool_learning_normalized,
              task_execution_normalized, collaboration_normalized, risk_attitude_normalized,
              completed_at
       FROM user_opc_results
       WHERE user_id = $1
       ORDER BY completed_at DESC
       LIMIT 1`,
      [userId]
    );

    if (!testResult) {
      throw new AppError(404, '该用户尚未完成OPC测试', 'TEST_NOT_FOUND');
    }

    // 查询用户基本信息
    const user = await queryOne<{
      username: string;
      avatar_url: string;
    }>(
      'SELECT username, avatar_url FROM users WHERE id = $1',
      [userId]
    );

    // 查询学生画像数据
    const profile = await queryOne<{
      task_count: number;
      six_dim_scores: Record<string, number>;
      opc_label: string;
      level_a: number;
      level_b: number;
    }>(
      `SELECT task_count, six_dim_scores, opc_label, level_a, level_b
       FROM student_profiles
       WHERE user_id = $1`,
      [userId]
    );

    // 构建详细报告
    const report = {
      reportId: testResult.id,
      generatedAt: new Date(),
      testCompletedAt: testResult.completed_at,
      testVersion: testResult.test_version,

      // 用户信息
      userInfo: {
        userId,
        username: user?.username || '未知用户',
        avatarUrl: user?.avatar_url,
      },

      // 人格画像
      personality: {
        tag: testResult.personality_tag,
        description: testResult.personality_description,
      },

      // 六维能力雷达图数据
      sixDimensions: {
        information_processing: testResult.information_processing_normalized,
        creation_drive: testResult.creation_drive_normalized,
        tool_learning: testResult.tool_learning_normalized,
        task_execution: testResult.task_execution_normalized,
        collaboration: testResult.collaboration_normalized,
        risk_attitude: testResult.risk_attitude_normalized,
      },

      // 维度详细解读
      dimensionInterpretations: testResult.dimension_interpretations,

      // 推荐信息
      recommendations: {
        track: testResult.recommended_track,
        level: testResult.recommended_level,
        firstTask: testResult.recommended_first_task,
      },

      // 成长数据（如果有）
      growthData: profile ? {
        taskCount: profile.task_count,
        currentLevel: { a: profile.level_a, b: profile.level_b },
        opcLabel: profile.opc_label,
        sixDimScores: profile.six_dim_scores,
      } : null,

      // 报告配置
      reportConfig: {
        showDetailedAnalysis: true,
        showRecommendations: true,
        showGrowthTimeline: profile && profile.task_count > 0,
      },
    };

    res.json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// GET /opc/questions
// 获取OPC测试题目（36题）
// ============================================================
export async function getTestQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const questions = await query(
      `SELECT question_number, dimension, question_text,
              option_a, option_b, option_c, option_d
       FROM opc_test_questions
       ORDER BY question_number ASC`
    );

    if (!questions || questions.length === 0) {
      throw new AppError(404, '测试题目未初始化', 'QUESTIONS_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        totalQuestions: questions.length,
        questions: questions.map((q: any) => ({
          questionNumber: q.question_number,
          dimension: q.dimension,
          questionText: q.question_text,
          options: {
            A: q.option_a,
            B: q.option_b,
            C: q.option_c,
            D: q.option_d,
          },
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// POST /opc/submit
// 提交OPC测试答案并生成结果
// ============================================================
export async function submitTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length !== 36) {
      throw new AppError(400, '答案格式错误，需要36道题的答案', 'INVALID_ANSWERS');
    }

    // 获取所有题目及其评分规则
    const questions = await query<{
      question_number: number;
      dimension: string;
      score_a: number;
      score_b: number;
      score_c: number;
      score_d: number;
    }>(
      'SELECT question_number, dimension, score_a, score_b, score_c, score_d FROM opc_test_questions ORDER BY question_number'
    );

    // 计算六维原始得分
    const dimensionScores: Record<string, number> = {
      information_processing: 0,
      creation_drive: 0,
      tool_learning: 0,
      task_execution: 0,
      collaboration: 0,
      risk_attitude: 0,
    };

    const answersWithScores = answers.map((answer: { questionNumber: number; answer: string }) => {
      const question = questions.find((q) => q.question_number === answer.questionNumber);
      if (!question) {
        throw new AppError(400, `题目 ${answer.questionNumber} 不存在`, 'INVALID_QUESTION');
      }

      const answerUpper = answer.answer.toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(answerUpper)) {
        throw new AppError(400, `题目 ${answer.questionNumber} 答案无效`, 'INVALID_ANSWER');
      }

      const scoreKey = `score_${answerUpper.toLowerCase()}` as 'score_a' | 'score_b' | 'score_c' | 'score_d';
      const score = question[scoreKey];

      dimensionScores[question.dimension] += score;

      return {
        question_number: answer.questionNumber,
        answer: answerUpper,
        score,
      };
    });

    // 归一化得分（0-18 -> 0-100）
    const normalizedScores: Record<string, number> = {};
    Object.keys(dimensionScores).forEach((dim) => {
      normalizedScores[dim] = Math.round((dimensionScores[dim] / 18) * 100);
    });

    // 生成人格标签（简化版，实际应该有更复杂的算法）
    const personalityTag = generatePersonalityTag(normalizedScores);
    const personalityDescription = generatePersonalityDescription(personalityTag, normalizedScores);
    const dimensionInterpretations = generateDimensionInterpretations(normalizedScores);
    const recommendations = generateRecommendations(normalizedScores, personalityTag);

    // 保存测试结果
    const result = await queryOne<{ id: string }>(
      `INSERT INTO user_opc_results (
        user_id, test_version,
        information_processing_score, creation_drive_score, tool_learning_score,
        task_execution_score, collaboration_score, risk_attitude_score,
        information_processing_normalized, creation_drive_normalized, tool_learning_normalized,
        task_execution_normalized, collaboration_normalized, risk_attitude_normalized,
        personality_tag, personality_description, dimension_interpretations,
        recommended_track, recommended_level, recommended_first_task, answers
      ) VALUES (
        $1, '2.0',
        $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16,
        $17, $18, $19, $20
      ) RETURNING id`,
      [
        userId,
        dimensionScores.information_processing,
        dimensionScores.creation_drive,
        dimensionScores.tool_learning,
        dimensionScores.task_execution,
        dimensionScores.collaboration,
        dimensionScores.risk_attitude,
        normalizedScores.information_processing,
        normalizedScores.creation_drive,
        normalizedScores.tool_learning,
        normalizedScores.task_execution,
        normalizedScores.collaboration,
        normalizedScores.risk_attitude,
        personalityTag,
        personalityDescription,
        JSON.stringify(dimensionInterpretations),
        recommendations.track,
        recommendations.level,
        recommendations.firstTask,
        JSON.stringify(answersWithScores),
      ]
    );

    // 更新用户表
    await query(
      `UPDATE users
       SET opc_personality_tag = $1, opc_completed_at = NOW(), opc_test_version = '2.0'
       WHERE id = $2`,
      [personalityTag, userId]
    );

    res.json({
      success: true,
      data: {
        testId: result?.id,
        personalityTag,
        personalityDescription,
        sixDimensions: normalizedScores,
        dimensionInterpretations,
        recommendations,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// 辅助函数：生成人格标签
// ============================================================
function generatePersonalityTag(scores: Record<string, number>): string {
  const tags = [
    { tag: '视觉叙事者', condition: (s: Record<string, number>) => s.creation_drive > 70 && s.information_processing > 60 },
    { tag: '系统构建者', condition: (s: Record<string, number>) => s.task_execution > 70 && s.tool_learning > 60 },
    { tag: '快速学习者', condition: (s: Record<string, number>) => s.tool_learning > 75 },
    { tag: '协作推动者', condition: (s: Record<string, number>) => s.collaboration > 70 },
    { tag: '冒险探索者', condition: (s: Record<string, number>) => s.risk_attitude > 70 },
    { tag: '稳健执行者', condition: (s: Record<string, number>) => s.task_execution > 70 && s.risk_attitude < 50 },
  ];

  for (const { tag, condition } of tags) {
    if (condition(scores)) {
      return tag;
    }
  }

  return '全能型选手';
}

// ============================================================
// 辅助函数：生成人格描述
// ============================================================
function generatePersonalityDescription(tag: string, scores: Record<string, number>): string {
  const descriptions: Record<string, string> = {
    视觉叙事者: '你擅长通过视觉元素讲述故事，对信息的处理和创作有独特的敏感度。',
    系统构建者: '你善于构建完整的系统，执行力强，能够快速掌握新工具。',
    快速学习者: '你对新工具和新技能的学习能力出众，能够快速适应变化。',
    协作推动者: '你在团队协作中表现出色，善于推动项目进展。',
    冒险探索者: '你勇于尝试新事物，不惧怕风险，喜欢探索未知领域。',
    稳健执行者: '你执行力强，做事稳健可靠，能够按时完成任务。',
    全能型选手: '你在各个维度都表现均衡，是一个全面发展的人才。',
  };

  return descriptions[tag] || '你有独特的能力组合，适合多种类型的任务。';
}

// ============================================================
// 辅助函数：生成维度解读
// ============================================================
function generateDimensionInterpretations(scores: Record<string, number>): Record<string, unknown> {
  return {
    information_processing: {
      score: scores.information_processing,
      interpretation: scores.information_processing > 70 ? '你对信息的处理能力很强' : '你在信息处理方面还有提升空间',
    },
    creation_drive: {
      score: scores.creation_drive,
      interpretation: scores.creation_drive > 70 ? '你有很强的创作驱动力' : '你的创作驱动力中等',
    },
    tool_learning: {
      score: scores.tool_learning,
      interpretation: scores.tool_learning > 70 ? '你学习新工具的能力出众' : '你可以通过实践提升工具学习能力',
    },
    task_execution: {
      score: scores.task_execution,
      interpretation: scores.task_execution > 70 ? '你的任务执行力很强' : '你可以通过建立习惯提升执行力',
    },
    collaboration: {
      score: scores.collaboration,
      interpretation: scores.collaboration > 70 ? '你在协作中表现出色' : '你更适合独立工作',
    },
    risk_attitude: {
      score: scores.risk_attitude,
      interpretation: scores.risk_attitude > 70 ? '你勇于冒险，敢于尝试' : '你做事稳健，偏好低风险',
    },
  };
}

// ============================================================
// 辅助函数：生成推荐信息
// ============================================================
function generateRecommendations(scores: Record<string, number>, tag: string): {
  track: string;
  level: string;
  firstTask: string;
} {
  const trackMap: Record<string, string> = {
    视觉叙事者: '设计与创意',
    系统构建者: '技术开发',
    快速学习者: '全栈开发',
    协作推动者: '项目管理',
    冒险探索者: '创新探索',
    稳健执行者: '运营执行',
    全能型选手: '综合发展',
  };

  const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
  const level = avgScore > 70 ? 'B级' : avgScore > 50 ? 'C级' : 'D级';

  return {
    track: trackMap[tag] || '综合发展',
    level,
    firstTask: '建议从简单的任务开始，逐步提升难度',
  };
}
