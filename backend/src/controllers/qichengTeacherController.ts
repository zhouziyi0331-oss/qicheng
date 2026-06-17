import { Request, Response } from 'express';
import qichengTeacherService from '../services/qichengTeacherService';
import logger from '../utils/logger';

/**
 * 启程老师控制器
 * 提供任务翻译API
 */

/**
 * 获取任务的启程老师翻译
 * GET /api/v1/tasks/:taskId/translation
 */
export const getTaskTranslation = async (req: Request, res: Response) => {
  const { taskId } = req.params;

  try {
    logger.info(`Getting translation for task ${taskId}`);

    // 先查询缓存的翻译
    const translation = await qichengTeacherService.getTranslation(taskId);

    if (translation) {
      return res.json({
        success: true,
        translation: {
          studentFriendlyTitle: translation.student_friendly_title,
          studentFriendlyDescription: translation.student_friendly_description,
          functionalModules: translation.functional_modules,
          whatYouWillDo: translation.what_you_will_do,
          whatYouWillLearn: translation.what_you_will_learn,
          difficulty: translation.difficulty_breakdown,
          estimatedHours: translation.estimated_hours,
          translatedAt: translation.created_at
        }
      });
    }

    // 如果没有缓存，实时生成
    const result = await qichengTeacherService.analyzeAndTranslateTask(taskId as any);

    res.json({
      success: true,
      translation: {
        studentFriendlyTitle: result.student_friendly_title,
        studentFriendlyDescription: result.student_friendly_description,
        functionalModules: result.functional_modules,
        whatYouWillDo: result.what_you_will_do,
        whatYouWillLearn: result.what_you_will_learn,
        difficulty: result.difficulty,
        estimatedHours: result.estimated_hours
      }
    });
  } catch (error: any) {
    logger.error('Get task translation failed:', error);
    res.status(500).json({
      error: '翻译失败',
      message: error.message
    });
  }
};

/**
 * 为任务生成需求摘要（用于向量生成）
 * POST /api/v1/tasks/:taskId/generate-summary
 */
export const generateRequirementSummary = async (req: Request, res: Response) => {
  const { taskId } = req.params;

  try {
    logger.info(`Generating requirement summary for task ${taskId}`);

    const summary = await qichengTeacherService.generateProjectRequirementSummary(taskId);

    res.json({
      success: true,
      summary
    });
  } catch (error: any) {
    logger.error('Generate requirement summary failed:', error);
    res.status(500).json({
      error: '生成失败',
      message: error.message
    });
  }
};
