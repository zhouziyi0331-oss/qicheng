import { Request, Response } from 'express';
import {
  AIRequirementEngine,
  AITaskDecompositionEngine,
  AITaskReviewEngine,
  AIQAEngine
} from '../services/aiEngineService';

/**
 * AI需求确认控制器
 */
export class AIRequirementController {
  /**
   * 开始需求确认对话
   */
  static async startDialogue(req: Request, res: Response) {
    try {
      const companyId = req.user!.userId;
      const { taskDraftId } = req.body;

      const result = await AIRequirementEngine.startDialogue(companyId, taskDraftId);

      res.json({
        success: true,
        data: result,
        message: 'AI对话已开始'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 发送消息
   */
  static async sendMessage(req: Request, res: Response) {
    try {
      const companyId = req.user!.userId;
      const { sessionId, message } = req.body;

      const response = await AIRequirementEngine.processMessage(sessionId, companyId, message);

      res.json({
        success: true,
        data: response
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 获取对话历史
   */
  static async getDialogueHistory(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;

      const history = await AIRequirementEngine.getDialogueHistory(sessionId);

      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

/**
 * AI任务拆解控制器
 */
export class AITaskDecompositionController {
  /**
   * 拆解任务
   */
  static async decomposeTask(req: Request, res: Response) {
    try {
      const { taskId, taskDescription } = req.body;

      const decomposition = await AITaskDecompositionEngine.decomposeTask(taskId, taskDescription);

      res.json({
        success: true,
        data: decomposition,
        message: '任务拆解完成'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 创建子任务
   */
  static async createSubtasks(req: Request, res: Response) {
    try {
      const { decompositionId, parentTaskId } = req.body;

      await AITaskDecompositionEngine.createSubtasks(decompositionId, parentTaskId);

      res.json({
        success: true,
        message: '子任务已创建'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 获取子任务列表
   */
  static async getSubtasks(req: Request, res: Response) {
    try {
      const { taskId } = req.params;

      const subtasks = await AITaskDecompositionEngine.getSubtasks(parseInt(taskId));

      res.json({
        success: true,
        data: subtasks
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

/**
 * AI任务审核控制器
 */
export class AITaskReviewController {
  /**
   * AI审核任务
   */
  static async reviewTask(req: Request, res: Response) {
    try {
      const { taskId, taskData } = req.body;

      const review = await AITaskReviewEngine.reviewTask(taskId, taskData);

      res.json({
        success: true,
        data: review,
        message: 'AI审核完成'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 人工审核
   */
  static async humanReview(req: Request, res: Response) {
    try {
      const reviewerId = req.user!.userId;
      const { reviewId } = req.params;
      const { approved, feedback } = req.body;

      await AITaskReviewEngine.humanReview(parseInt(reviewId), reviewerId, approved, feedback);

      res.json({
        success: true,
        message: '人工审核完成'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

/**
 * AI问答控制器
 */
export class AIQAController {
  /**
   * 提问
   */
  static async askQuestion(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { question, taskId } = req.body;

      const answer = await AIQAEngine.answerQuestion(userId, question, taskId);

      res.json({
        success: true,
        data: answer
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * 标记答案是否有帮助
   */
  static async markHelpful(req: Request, res: Response) {
    try {
      const { historyId } = req.params;
      const { isHelpful } = req.body;

      await AIQAEngine.markHelpful(parseInt(historyId), isHelpful);

      res.json({
        success: true,
        message: '反馈已记录'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
