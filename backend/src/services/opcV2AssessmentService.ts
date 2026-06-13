import { pool, QueryResult } from '../utils/db';
import logger from '../utils/logger';

/**
 * OPC能力画像测试服务 v2.0
 * 六维度模型: 信息处理、创作驱动、工具学习、任务执行、协作倾向、风险态度
 */

interface DimensionScore {
  raw: number;
  normalized: number;
  tendency: string;
}

interface AssessmentResult {
  info_processing: DimensionScore;
  creation_drive: DimensionScore;
  tool_learning: DimensionScore;
  task_execution: DimensionScore;
  collaboration: DimensionScore;
  risk_attitude: DimensionScore;
  personality_label: string;
  recommended_track: string;
  recommended_first_task: string;
}

export class OPCV2AssessmentService {
  /**
   * 开始新测试
   */
  static async startAssessment(studentId: string) {
    // 检查是否有进行中的测试
    const existingResult = await pool.query(
      `SELECT id FROM opc_v2_assessments
       WHERE student_id = $1 AND status = 'in_progress'`,
      [studentId]
    );

    if (existingResult.rows.length > 0) {
      // 返回现有测试
      return await this.getAssessmentProgress(existingResult.rows[0].id);
    }

    // 创建新测试会话
    const assessmentResult = await pool.query(
      `INSERT INTO opc_v2_assessments (student_id, status, current_question, total_questions)
       VALUES ($1, 'in_progress', 1, 38)
       RETURNING *`,
      [studentId]
    );

    // 获取所有题目
    const questionsResult = await pool.query(
      `SELECT id, question_number, question_type, question_text, prompt_text,
              options, dimension, input_type, max_length
       FROM opc_v2_questions
       WHERE is_active = TRUE
       ORDER BY display_order`
    );

    return {
      assessment: assessmentResult.rows[0],
      questions: questionsResult.rows
    };
  }

  /**
   * 提交答案
   */
  static async submitAnswer(
    assessmentId: string,
    questionId: string,
    answer: {
      answerText?: string;
      selectedOption?: string;
      selfDefinedIdentity?: string[];
      selfDefinedAwesome?: string;
    }
  ) {
    // 获取题目信息
    const questionResult = await pool.query(
      `SELECT question_number, question_type, dimension, options
       FROM opc_v2_questions WHERE id = $1`,
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      throw new Error('题目不存在');
    }

    const question = questionResult.rows[0];

    // 处理前置定义题
    if (question.question_type === 'definition') {
      if (question.question_number === 1) {
        // 题目1: 自我定义
        await pool.query(
          `UPDATE opc_v2_assessments
           SET self_defined_identity = $1
           WHERE id = $2`,
          [answer.selfDefinedIdentity || [], assessmentId]
        );
      } else if (question.question_number === 2) {
        // 题目2: 自我定义的"厉害"
        await pool.query(
          `UPDATE opc_v2_assessments
           SET self_defined_awesome = $1
           WHERE id = $2`,
          [answer.selfDefinedAwesome || '', assessmentId]
        );
      }

      // 保存答案记录
      await pool.query(
        `INSERT INTO opc_v2_answers (assessment_id, question_id, answer_text)
         VALUES ($1, $2, $3)
         ON CONFLICT (assessment_id, question_id) DO UPDATE
         SET answer_text = EXCLUDED.answer_text`,
        [assessmentId, questionId, answer.answerText || '']
      );
    } else {
      // 处理选择题
      const options = question.options;
      const selectedOption = answer.selectedOption;

      if (!selectedOption) {
        throw new Error('未选择答案');
      }

      // 查找选项的计分信息
      const optionData = options.find((opt: any) => opt.label === selectedOption);
      if (!optionData) {
        throw new Error('无效的选项');
      }

      const scoring = optionData.scoring;

      // 保存答案记录
      await pool.query(
        `INSERT INTO opc_v2_answers
         (assessment_id, question_id, selected_option, dimension, score_value, score_direction)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (assessment_id, question_id) DO UPDATE
         SET selected_option = EXCLUDED.selected_option,
             dimension = EXCLUDED.dimension,
             score_value = EXCLUDED.score_value,
             score_direction = EXCLUDED.score_direction`,
        [
          assessmentId,
          questionId,
          selectedOption,
          scoring.dimension,
          scoring.value,
          scoring.direction
        ]
      );
    }

    // 更新进度
    await pool.query(
      `UPDATE opc_v2_assessments
       SET current_question = current_question + 1
       WHERE id = $1`,
      [assessmentId]
    );

    return { success: true };
  }

  /**
   * 完成测试并生成结果
   */
  static async completeAssessment(assessmentId: string) {
    // 获取所有答案
    const answersResult = await pool.query(
      `SELECT dimension, score_value, score_direction
       FROM opc_v2_answers
       WHERE assessment_id = $1 AND dimension IS NOT NULL`,
      [assessmentId]
    );

    // 计算六个维度的原始分
    const dimensionScores: any = {
      info_processing: { analytical: 0, integrative: 0 },
      creation_drive: { visual: 0, logical: 0 },
      tool_learning: { exploratory: 0, manual: 0 },
      task_execution: { planning: 0, iterative: 0 },
      collaboration: { independent: 0, collaborative: 0 },
      risk_attitude: { conservative: 0, adventurous: 0 }
    };

    // 累加分数
    for (const answer of answersResult.rows) {
      const dimension = answer.dimension;
      const direction = answer.score_direction;
      const value = answer.score_value;

      if (dimensionScores[dimension] && dimensionScores[dimension][direction] !== undefined) {
        dimensionScores[dimension][direction] += value;
      }
    }

    // 计算归一化分数和倾向
    const result: any = {};

    // 信息处理: 拆解型(0-40) vs 整合型(61-100)
    const infoTotal = dimensionScores.info_processing.analytical + dimensionScores.info_processing.integrative;
    const infoIntegrativeRatio = infoTotal > 0 ? dimensionScores.info_processing.integrative / infoTotal : 0.5;
    result.info_processing_raw = dimensionScores.info_processing.integrative;
    result.info_processing_score = Math.round(infoIntegrativeRatio * 100);
    result.info_processing_tendency = result.info_processing_score >= 50 ? 'integrative' : 'analytical';

    // 创作驱动: 视觉型(61-100) vs 逻辑型(0-40)
    const creationTotal = dimensionScores.creation_drive.visual + dimensionScores.creation_drive.logical;
    const creationVisualRatio = creationTotal > 0 ? dimensionScores.creation_drive.visual / creationTotal : 0.5;
    result.creation_drive_raw = dimensionScores.creation_drive.visual;
    result.creation_drive_score = Math.round(creationVisualRatio * 100);
    result.creation_drive_tendency = result.creation_drive_score >= 50 ? 'visual' : 'logical';

    // 工具学习: 探索型(61-100) vs 手册型(0-40)
    const toolTotal = dimensionScores.tool_learning.exploratory + dimensionScores.tool_learning.manual;
    const toolExploratoryRatio = toolTotal > 0 ? dimensionScores.tool_learning.exploratory / toolTotal : 0.5;
    result.tool_learning_raw = dimensionScores.tool_learning.exploratory;
    result.tool_learning_score = Math.round(toolExploratoryRatio * 100);
    result.tool_learning_tendency = result.tool_learning_score >= 50 ? 'exploratory' : 'manual';

    // 任务执行: 规划型(61-100) vs 迭代型(0-40)
    const taskTotal = dimensionScores.task_execution.planning + dimensionScores.task_execution.iterative;
    const taskPlanningRatio = taskTotal > 0 ? dimensionScores.task_execution.planning / taskTotal : 0.5;
    result.task_execution_raw = dimensionScores.task_execution.planning;
    result.task_execution_score = Math.round(taskPlanningRatio * 100);
    result.task_execution_tendency = result.task_execution_score >= 50 ? 'planning' : 'iterative';

    // 协作倾向: 协作型(61-100) vs 独立型(0-40)
    const collabTotal = dimensionScores.collaboration.independent + dimensionScores.collaboration.collaborative;
    const collabCollaborativeRatio = collabTotal > 0 ? dimensionScores.collaboration.collaborative / collabTotal : 0.5;
    result.collaboration_raw = dimensionScores.collaboration.collaborative;
    result.collaboration_score = Math.round(collabCollaborativeRatio * 100);
    result.collaboration_tendency = result.collaboration_score >= 50 ? 'collaborative' : 'independent';

    // 风险态度: 冒险型(61-100) vs 稳健型(0-40)
    const riskTotal = dimensionScores.risk_attitude.conservative + dimensionScores.risk_attitude.adventurous;
    const riskAdventurousRatio = riskTotal > 0 ? dimensionScores.risk_attitude.adventurous / riskTotal : 0.5;
    result.risk_attitude_raw = dimensionScores.risk_attitude.adventurous;
    result.risk_attitude_score = Math.round(riskAdventurousRatio * 100);
    result.risk_attitude_tendency = result.risk_attitude_score >= 50 ? 'adventurous' : 'conservative';

    // 判定人格标签
    const personalityLabel = await this.determinePersonalityLabel(result);
    result.personality_label = personalityLabel.label_name;
    result.recommended_track = personalityLabel.recommended_track;
    result.recommended_first_task = personalityLabel.recommended_first_task;

    // 生成维度描述
    result.dimension_descriptions = this.generateDimensionDescriptions(result);

    // 获取学生ID
    const assessmentInfo = await pool.query(
      `SELECT student_id FROM opc_v2_assessments WHERE id = $1`,
      [assessmentId]
    );

    // 保存结果
    const savedResult = await pool.query(
      `INSERT INTO opc_v2_results (
        assessment_id, student_id,
        info_processing_raw, creation_drive_raw, tool_learning_raw,
        task_execution_raw, collaboration_raw, risk_attitude_raw,
        info_processing_score, creation_drive_score, tool_learning_score,
        task_execution_score, collaboration_score, risk_attitude_score,
        info_processing_tendency, creation_drive_tendency, tool_learning_tendency,
        task_execution_tendency, collaboration_tendency, risk_attitude_tendency,
        personality_label, recommended_track, recommended_first_task,
        dimension_descriptions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
      [
        assessmentId, assessmentInfo.rows[0].student_id,
        result.info_processing_raw, result.creation_drive_raw, result.tool_learning_raw,
        result.task_execution_raw, result.collaboration_raw, result.risk_attitude_raw,
        result.info_processing_score, result.creation_drive_score, result.tool_learning_score,
        result.task_execution_score, result.collaboration_score, result.risk_attitude_score,
        result.info_processing_tendency, result.creation_drive_tendency, result.tool_learning_tendency,
        result.task_execution_tendency, result.collaboration_tendency, result.risk_attitude_tendency,
        result.personality_label, result.recommended_track, result.recommended_first_task,
        JSON.stringify(result.dimension_descriptions)
      ]
    );

    // 更新测试状态
    await pool.query(
      `UPDATE opc_v2_assessments
       SET status = 'completed', completed_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [assessmentId]
    );

    // 自动触发工作条件画像生成（异步队列）
    try {
      const { enqueueAITask, AITaskType } = require('./aiTaskQueue');
      const studentId = assessmentInfo.rows[0].student_id;

      // 获取完整的答案数据
      const allAnswers = await pool.query(
        `SELECT question_id, answer_value FROM opc_v2_answers WHERE assessment_id = $1`,
        [assessmentId]
      );

      const answers: Record<string, any> = {};
      for (const ans of allAnswers.rows) {
        answers[ans.question_id] = ans.answer_value;
      }

      // 添加到队列（异步处理）
      await enqueueAITask({
        type: AITaskType.PROFILE_ANALYSIS,
        studentId,
        assessmentId,
        answers,
        scores: result
      });

      logger.info(`[OPC] Enqueued work condition profile generation for student ${studentId}`);
    } catch (error) {
      logger.error('[OPC] Failed to enqueue work condition profile generation:', error);
      // 不影响测试完成流程，只记录错误
    }

    return savedResult.rows[0];
  }

  /**
   * 判定人格标签
   */
  private static async determinePersonalityLabel(scores: any) {
    // 获取所有标签定义
    const labelsResult = await pool.query(
      `SELECT * FROM opc_v2_personality_labels
       WHERE is_active = TRUE
       ORDER BY priority ASC`
    );

    // 按优先级匹配
    for (const label of labelsResult.rows) {
      const rules = label.matching_rules;
      let matched = true;

      for (const [dimension, range] of Object.entries(rules)) {
        const scoreKey = `${dimension}_score`;
        const score = scores[scoreKey];

        if (range && typeof range === 'object') {
          const min = (range as any).min || 0;
          const max = (range as any).max || 100;

          if (score < min || score > max) {
            matched = false;
            break;
          }
        }
      }

      if (matched) {
        return label;
      }
    }

    // 默认返回混合型
    const mixedLabel = labelsResult.rows.find((l: any) => l.label_name === '混合型');
    return mixedLabel || labelsResult.rows[labelsResult.rows.length - 1];
  }

  /**
   * 生成维度描述
   */
  private static generateDimensionDescriptions(scores: any) {
    const descriptions: any = {};

    // 信息处理
    if (scores.info_processing_score >= 60) {
      descriptions.info_processing = '你倾向于整合型思维，喜欢先看全貌，找到各部分之间的联系，适合做系统架构和整体规划。';
    } else if (scores.info_processing_score <= 40) {
      descriptions.info_processing = '你倾向于拆解型思维，喜欢把大问题切成小块逐一解决，适合做细分执行和具体实现。';
    } else {
      descriptions.info_processing = '你在拆解和整合之间保持平衡，能够根据任务特点灵活调整思维方式。';
    }

    // 创作驱动
    if (scores.creation_drive_score >= 60) {
      descriptions.creation_drive = '你的灵感更多来源于视觉、色彩、空间等感性元素，适合内容创作赛道。';
    } else if (scores.creation_drive_score <= 40) {
      descriptions.creation_drive = '你的灵感更多来源于规则、结构、因果等理性元素，适合工具开发赛道。';
    } else {
      descriptions.creation_drive = '你在视觉和逻辑之间保持平衡，既能欣赏美感也能理解结构。';
    }

    // 工具学习
    if (scores.tool_learning_score >= 60) {
      descriptions.tool_learning = '你是探索型学习者，拿到新工具直接上手试，边用边学，学习效率高。';
    } else if (scores.tool_learning_score <= 40) {
      descriptions.tool_learning = '你是手册型学习者，喜欢先看文档教程，理解原理再动手，基础扎实。';
    } else {
      descriptions.tool_learning = '你在探索和手册之间保持平衡，能够根据工具复杂度选择学习方式。';
    }

    // 任务执行
    if (scores.task_execution_score >= 60) {
      descriptions.task_execution = '你是规划型执行者，动手前先列完整计划，按步骤推进，适合瀑布式项目。';
    } else if (scores.task_execution_score <= 40) {
      descriptions.task_execution = '你是迭代型执行者，先出粗糙版本再打磨，适合敏捷式项目。';
    } else {
      descriptions.task_execution = '你在规划和迭代之间保持平衡，能够根据项目特点调整执行方式。';
    }

    // 协作倾向
    if (scores.collaboration_score >= 60) {
      descriptions.collaboration = '你喜欢和他人分工配合，各展所长，适合团队项目。';
    } else if (scores.collaboration_score <= 40) {
      descriptions.collaboration = '你喜欢自己从头到尾负责完整模块，适合独立接单。';
    } else {
      descriptions.collaboration = '你在独立和协作之间保持平衡，能够适应不同的工作模式。';
    }

    // 风险态度
    if (scores.risk_attitude_score >= 60) {
      descriptions.risk_attitude = '你愿意挑战没做过的事，边做边学，适合探索性项目。';
    } else if (scores.risk_attitude_score <= 40) {
      descriptions.risk_attitude = '你倾向选择有把握的任务，确保交付质量，适合常规项目。';
    } else {
      descriptions.risk_attitude = '你在稳健和冒险之间保持平衡，能够根据情况评估风险。';
    }

    return descriptions;
  }

  /**
   * 获取测试进度
   */
  static async getAssessmentProgress(assessmentId: string) {
    const assessmentResult = await pool.query(
      `SELECT * FROM opc_v2_assessments WHERE id = $1`,
      [assessmentId]
    );

    if (assessmentResult.rows.length === 0) {
      throw new Error('测试不存在');
    }

    const assessment = assessmentResult.rows[0];

    // 获取已答题目
    const answersResult = await pool.query(
      `SELECT question_id FROM opc_v2_answers WHERE assessment_id = $1`,
      [assessmentId]
    );

    const answeredQuestionIds = answersResult.rows.map((r: any) => r.question_id);

    return {
      assessment,
      answeredQuestionIds
    };
  }

  /**
   * 获取测试结果
   */
  static async getAssessmentResult(assessmentId: string) {
    const result = await pool.query(
      `SELECT * FROM opc_v2_results WHERE assessment_id = $1`,
      [assessmentId]
    );

    if (result.rows.length === 0) {
      throw new Error('测试结果不存在');
    }

    return result.rows[0];
  }

  /**
   * 获取学生的最新测试结果
   */
  static async getLatestResult(studentId: string) {
    const result = await pool.query(
      `SELECT r.* FROM opc_v2_results r
       JOIN opc_v2_assessments a ON r.assessment_id = a.id
       WHERE r.student_id = $1
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [studentId]
    );

    return result.rows[0] || null;
  }
}
