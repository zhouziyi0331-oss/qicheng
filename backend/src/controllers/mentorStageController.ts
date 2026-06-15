import { Request, Response } from 'express';
import { mentorStageService, MentorStage, StageStatus } from '../services/mentorStageService';
import { mentorTriggerService } from '../services/mentorTriggerService';
import { mentorPromptBuilder } from '../services/mentorPromptBuilder';
import { aiServiceClient } from '../services/aiServiceClient';
import { emotionAnalysisService } from '../services/emotionAnalysisService';
import { growthTrackingService } from '../services/growthTrackingService';
import mentorMemoryService from '../services/mentorMemoryService';
import { adaptiveGuidanceService } from '../services/adaptiveGuidanceService';
import { toolRecommendationService } from '../services/toolRecommendationService';
import { proactiveFollowUpService } from '../services/proactiveFollowUpService';
import { mentorScheduler } from '../services/mentorScheduler';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * AI导师阶段控制器（终极版 - 完整功能）
 */

/**
 * 获取当前会话信息
 */
export async function getCurrentSession(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    const session = await mentorStageService.getSessionByTaskId(taskId);

    if (!session) {
      return res.json({
        success: true,
        data: null,
      });
    }

    // 验证学生权限
    if (session.studentId !== studentId) {
      throw new AppError(403, '无权访问此会话', 'FORBIDDEN');
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    logger.error('获取会话失败', { error });
    throw error;
  }
}

/**
 * 获取会话消息历史
 */
export async function getSessionMessages(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const studentId = req.user?.userId;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    // 验证权限
    const session = await mentorStageService.getSession(sessionId);
    if (!session) {
      throw new AppError(404, '会话不存在', 'SESSION_NOT_FOUND');
    }

    if (session.studentId !== studentId) {
      throw new AppError(403, '无权访问此会话', 'FORBIDDEN');
    }

    const messages = await mentorStageService.getMessages(
      sessionId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: {
        messages,
        total: session.totalMessages,
      },
    });
  } catch (error: any) {
    logger.error('获取消息历史失败', { error });
    throw error;
  }
}

/**
 * 发送消息给导师（增强版 - 使用自适应引导）
 */
export async function sendMessage(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;
    const studentId = req.user?.userId;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    if (!content || content.trim().length === 0) {
      throw new AppError(400, '消息内容不能为空', 'EMPTY_MESSAGE');
    }

    // 验证权限
    const session = await mentorStageService.getSession(sessionId);
    if (!session) {
      throw new AppError(404, '会话不存在', 'SESSION_NOT_FOUND');
    }

    if (session.studentId !== studentId) {
      throw new AppError(403, '无权访问此会话', 'FORBIDDEN');
    }

    // 保存学生消息（会自动触发情绪分析、成长检测等）
    await mentorStageService.saveMessage(sessionId, 'student', content, {
      stage: session.currentStage,
    });

    // 使用自适应引导生成回复
    const startTime = Date.now();
    const guidance = await mentorStageService.generateAdaptiveResponse(
      sessionId,
      content
    );
    const responseTime = Date.now() - startTime;

    // 保存导师回复
    const messageId = await mentorStageService.saveMessage(
      sessionId,
      'mentor',
      guidance.content,
      {
        stage: session.currentStage,
        modelUsed: 'claude-adaptive', // 标记为自适应模式
        responseTimeMs: responseTime,
        extra: guidance.metadata,
      }
    );

    // 检查是否有未庆祝的里程碑
    const uncelebratedMilestones = await mentorStageService.getUncelebratedMilestones(
      session.studentId
    );

    res.json({
      success: true,
      data: {
        messageId,
        content: guidance.content,
        stage: session.currentStage,
        responseTime: responseTime,
        metadata: {
          ...guidance.metadata,
          uncelebratedMilestones: uncelebratedMilestones.length,
        },
      },
    });
  } catch (error: any) {
    logger.error('发送消息失败', { error });
    throw error;
  }
}

/**
 * 请求质量预审
 */
export async function requestQualityReview(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const { submission } = req.body;
    const studentId = req.user?.userId;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    if (!submission || submission.trim().length === 0) {
      throw new AppError(400, '提交内容不能为空', 'EMPTY_SUBMISSION');
    }

    // 触发质量预审
    const result = await mentorTriggerService.triggerQualityReview(
      taskId,
      studentId,
      submission
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('质量预审失败', { error });
    throw error;
  }
}

/**
 * 获取会话统计
 */
export async function getSessionStats(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    // 验证权限
    const session = await mentorStageService.getSession(sessionId);
    if (!session) {
      throw new AppError(404, '会话不存在', 'SESSION_NOT_FOUND');
    }

    if (session.studentId !== studentId) {
      throw new AppError(403, '无权访问此会话', 'FORBIDDEN');
    }

    const stats = await mentorStageService.getSessionStats(sessionId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('获取会话统计失败', { error });
    throw error;
  }
}

/**
 * 确认需求理解（阶段1完成）
 */
export async function confirmRequirementUnderstanding(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const { productFramework, score } = req.body;
    const studentId = req.user?.userId;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    // 验证权限
    const session = await mentorStageService.getSession(sessionId);
    if (!session) {
      throw new AppError(404, '会话不存在', 'SESSION_NOT_FOUND');
    }

    if (session.studentId !== studentId) {
      throw new AppError(403, '无权访问此会话', 'FORBIDDEN');
    }

    // 更新会话
    await mentorStageService.updateSession(sessionId, {
      requirementConfirmed: true,
      requirementUnderstandingScore: score,
      productFramework,
    });

    // 转换到执行引导阶段
    await mentorStageService.transitionStage(sessionId, MentorStage.EXECUTION_GUIDANCE);

    res.json({
      success: true,
      message: '需求理解确认成功，进入执行引导阶段',
    });
  } catch (error: any) {
    logger.error('确认需求理解失败', { error });
    throw error;
  }
}

// ========== 辅助函数 ==========

async function buildContextFromSession(session: any, currentMessage: string): Promise<any> {
  const { query, queryOne } = await import('../utils/db');

  // 获取任务信息
  const task = await queryOne<any>(
    `SELECT t.*, c.company_name, c.industry
     FROM tasks t
     LEFT JOIN companies c ON t.company_id = c.id
     WHERE t.id = $1`,
    [session.taskId]
  );

  // 获取学生信息
  const student = await queryOne<any>(
    `SELECT nickname, university, major FROM students WHERE id = $1`,
    [session.studentId]
  );

  return {
    taskTitle: task?.title || '',
    taskDescription: task?.description || '',
    taskRequirements: task?.requirements || '',
    taskDeadline: task?.deadline,
    studentName: student?.nickname || '同学',
    studentLevel: student?.university,
    studentMajor: student?.major,
    companyName: task?.company_name || '企业',
    companyIndustry: task?.industry,
    stageSpecificData: {
      studentQuestion: currentMessage,
    },
    conversationHistory: [] as Array<{ role: string; content: string }>,
  };
}

function mapModelRecommendation(recommendation: 'opus' | 'sonnet' | 'haiku'): string {
  switch (recommendation) {
    case 'opus':
      return 'claude-opus-4-7';
    case 'sonnet':
      return 'claude-sonnet-4-6';
    case 'haiku':
      return 'claude-haiku-4-5';
    default:
      return 'claude-sonnet-4-6';
  }
}

function calculateCost(model: string, tokens: number): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-opus-4-7': { input: 15, output: 75 },
    'claude-sonnet-4-6': { input: 3, output: 15 },
    'claude-haiku-4-5': { input: 0.8, output: 4 },
  };

  const modelPricing = pricing[model] || pricing['claude-sonnet-4-6'];
  const avgPrice = (modelPricing.input + modelPricing.output) / 2;
  return (tokens / 1000000) * avgPrice;
}

async function analyzeAndUpdateStats(sessionId: string, stage: MentorStage, content: string) {
  // 简单的关键词分析
  if (stage === MentorStage.EXECUTION_GUIDANCE) {
    // 检测是否包含鼓励性语言
    const encouragementKeywords = ['很好', '不错', '加油', '继续', '棒', '优秀', '进步'];
    if (encouragementKeywords.some(keyword => content.includes(keyword))) {
      await mentorStageService.incrementStats(sessionId, 'encouragementCount');
    }

    // 检测是否推荐了工具
    const toolKeywords = ['推荐', '工具', '使用', '可以试试', '建议'];
    if (toolKeywords.some(keyword => content.includes(keyword))) {
      // 这里可以进一步提取具体的工具名称
      // 暂时只增加计数
    }
  }
}

// ========== 灵魂系统API ==========

/**
 * 获取学生成长仪表板
 */
export async function getStudentGrowthDashboard(req: Request, res: Response) {
  try {
    const studentId = req.user?.userId;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    const dashboard = await mentorStageService.getStudentGrowthDashboard(studentId);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    logger.error('获取成长仪表板失败', { error });
    throw error;
  }
}

/**
 * 获取学生最近情绪
 */
export async function getRecentEmotions(req: Request, res: Response) {
  try {
    const studentId = req.user?.userId;
    const { limit = 10 } = req.query;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    const emotions = await emotionAnalysisService.getRecentEmotions(
      parseInt(studentId),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: emotions,
    });
  } catch (error: any) {
    logger.error('获取最近情绪失败', { error });
    throw error;
  }
}

/**
 * 获取学生成长里程碑
 */
export async function getGrowthMilestones(req: Request, res: Response) {
  try {
    const studentId = req.user?.userId;
    const { limit = 10 } = req.query;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    const milestones = await growthTrackingService.getRecentMilestones(
      parseInt(studentId),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: milestones,
    });
  } catch (error: any) {
    logger.error('获取成长里程碑失败', { error });
    throw error;
  }
}

/**
 * 获取未庆祝的里程碑
 */
export async function getUncelebratedMilestones(req: Request, res: Response) {
  try {
    const studentId = req.user?.userId;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    const milestones = await mentorStageService.getUncelebratedMilestones(studentId);

    res.json({
      success: true,
      data: milestones,
    });
  } catch (error: any) {
    logger.error('获取未庆祝里程碑失败', { error });
    throw error;
  }
}

/**
 * 庆祝里程碑
 */
export async function celebrateMilestone(req: Request, res: Response) {
  try {
    const { milestoneId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    await mentorStageService.celebrateMilestone(parseInt(milestoneId));

    res.json({
      success: true,
      message: '里程碑已庆祝',
    });
  } catch (error: any) {
    logger.error('庆祝里程碑失败', { error });
    throw error;
  }
}

/**
 * 获取导师记忆
 */
export async function getMentorMemories(req: Request, res: Response) {
  try {
    const studentId = req.user?.userId;
    const { memoryType, memoryCategory, minImportance, limit = 10 } = req.query;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    const memories = await mentorMemoryService.getAllMemories(
      parseInt(studentId),
      {
        memoryType: memoryType as string,
        memoryCategory: memoryCategory as string,
        minImportance: minImportance ? parseFloat(minImportance as string) : undefined,
        limit: parseInt(limit as string),
      }
    );

    res.json({
      success: true,
      data: memories,
    });
  } catch (error: any) {
    logger.error('获取导师记忆失败', { error });
    throw error;
  }
}

/**
 * 获取记忆统计
 */
export async function getMemoryStats(req: Request, res: Response) {
  try {
    const studentId = req.user?.userId;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    const stats = await mentorMemoryService.getMemoryStats(parseInt(studentId));

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('获取记忆统计失败', { error });
    throw error;
  }
}

/**
 * 获取成长统计
 */
export async function getGrowthStats(req: Request, res: Response) {
  try {
    const studentId = req.user?.userId;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    const stats = await growthTrackingService.getGrowthStats(parseInt(studentId));

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('获取成长统计失败', { error });
    throw error;
  }
}

/**
 * 获取引导建议
 */
export async function getGuidanceRecommendations(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    // 验证权限
    const session = await mentorStageService.getSession(sessionId);
    if (!session) {
      throw new AppError(404, '会话不存在', 'SESSION_NOT_FOUND');
    }

    if (session.studentId !== studentId) {
      throw new AppError(403, '无权访问此会话', 'FORBIDDEN');
    }

    const recommendations = await mentorStageService.getGuidanceRecommendations(sessionId);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    logger.error('获取引导建议失败', { error });
    throw error;
  }
}

// ========== 工具推荐API ==========

/**
 * 获取工具推荐
 */
export async function getToolRecommendations(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const studentId = req.user?.userId;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    const tools = await toolRecommendationService.recommendTools(
      parseInt(taskId),
      parseInt(studentId)
    );

    res.json({
      success: true,
      data: tools,
    });
  } catch (error: any) {
    logger.error('获取工具推荐失败', { error });
    throw error;
  }
}

/**
 * 反馈工具使用情况
 */
export async function feedbackToolUsage(req: Request, res: Response) {
  try {
    const { trackingId } = req.params;
    const { tried, succeeded, difficultyLevel, timeToLearnMinutes, comment, wouldRecommend } = req.body;
    const studentId = req.user?.userId;

    if (!studentId) {
      throw new AppError(401, '未授权', 'UNAUTHORIZED');
    }

    const result = await toolRecommendationService.recordToolUsage(
      parseInt(trackingId),
      {
        tried,
        succeeded,
        difficultyLevel,
        timeToLearnMinutes,
        comment,
        wouldRecommend
      }
    );

    res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    logger.error('反馈工具使用失败', { error });
    throw error;
  }
}

/**
 * 获取热门工具
 */
export async function getPopularTools(req: Request, res: Response) {
  try {
    const { category, limit = 5 } = req.query;

    const tools = await toolRecommendationService.getPopularTools(
      category as string,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: tools,
    });
  } catch (error: any) {
    logger.error('获取热门工具失败', { error });
    throw error;
  }
}

// ========== 主动跟进API ==========

/**
 * 手动触发主动跟进（管理员功能）
 */
export async function triggerFollowUps(req: Request, res: Response) {
  try {
    // 这里应该检查管理员权限
    // if (!req.user?.isAdmin) {
    //   throw new AppError(403, '需要管理员权限', 'FORBIDDEN');
    // }

    const result = await mentorScheduler.triggerFollowUps();

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('触发主动跟进失败', { error });
    throw error;
  }
}

/**
 * 获取调度器状态（管理员功能）
 */
export async function getSchedulerStatus(req: Request, res: Response) {
  try {
    const status = mentorScheduler.getStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    logger.error('获取调度器状态失败', { error });
    throw error;
  }
}
