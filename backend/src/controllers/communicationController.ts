import { Request, Response } from 'express';
import { communicationService } from '../services/communicationService';
import logger from '../utils/logger';

/**
 * 任务沟通中转系统控制器
 */
export class CommunicationController {
  /**
   * 企业添加补充说明
   */
  async addClarification(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { content } = req.body;
      const companyId = req.user?.userId;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '未授权访问'
        });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_INPUT',
          message: '补充说明内容不能为空'
        });
      }

      const clarificationId = await communicationService.addClarification(
        taskId,
        companyId,
        content
      );

      res.json({
        success: true,
        data: { clarificationId },
        message: '补充说明已添加'
      });
    } catch (error) {
      logger.error('添加补充说明失败:', error);
      res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        message: '添加补充说明失败'
      });
    }
  }

  /**
   * 学生提问（先问AI）
   */
  async askQuestion(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { question } = req.body;
      const studentId = req.user?.userId;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '未授权访问'
        });
      }

      if (!question || question.trim().length === 0) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_INPUT',
          message: '问题内容不能为空'
        });
      }

      const questionId = await communicationService.askQuestion(
        taskId,
        studentId,
        question
      );

      res.json({
        success: true,
        data: { questionId },
        message: '问题已提交，AI正在分析...'
      });
    } catch (error) {
      logger.error('提交问题失败:', error);
      res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        message: '提交问题失败'
      });
    }
  }

  /**
   * 获取AI回复
   */
  async getAIResponse(req: Request, res: Response) {
    try {
      const { questionId } = req.params;
      const studentId = req.user?.userId;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '未授权访问'
        });
      }

      const response = await communicationService.getAIResponse(questionId);

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      logger.error('获取AI回复失败:', error);
      res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        message: '获取AI回复失败'
      });
    }
  }

  /**
   * 学生选择转发给企业
   */
  async relayToCompany(req: Request, res: Response) {
    try {
      const { questionId } = req.params;
      const studentId = req.user?.userId;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '未授权访问'
        });
      }

      await communicationService.relayToCompany(questionId);

      res.json({
        success: true,
        message: '问题已转发给企业，企业将在24小时内回复'
      });
    } catch (error) {
      logger.error('转发问题失败:', error);
      res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        message: '转发问题失败'
      });
    }
  }

  /**
   * 企业回复学生问题
   */
  async replyToStudent(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const { reply } = req.body;
      const companyId = req.user?.userId;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '未授权访问'
        });
      }

      if (!reply || reply.trim().length === 0) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_INPUT',
          message: '回复内容不能为空'
        });
      }

      await communicationService.replyToStudent(messageId, reply);

      res.json({
        success: true,
        message: '回复已发送'
      });
    } catch (error) {
      logger.error('回复学生失败:', error);
      res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        message: '回复学生失败'
      });
    }
  }

  /**
   * 获取任务的所有沟通记录
   */
  async getCommunicationHistory(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '未授权访问'
        });
      }

      const history = await communicationService.getCommunicationHistory(taskId, userId);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('获取沟通记录失败:', error);
      res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        message: '获取沟通记录失败'
      });
    }
  }

  /**
   * 企业获取待回复的学生问题列表
   */
  async getPendingQuestions(req: Request, res: Response) {
    try {
      const companyId = req.user?.userId;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '未授权访问'
        });
      }

      const questions = await communicationService.getPendingQuestions(companyId);

      res.json({
        success: true,
        data: questions
      });
    } catch (error) {
      logger.error('获取待回复问题失败:', error);
      res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        message: '获取待回复问题失败'
      });
    }
  }

  /**
   * 学生获取问题状态
   */
  async getQuestionStatus(req: Request, res: Response) {
    try {
      const { questionId } = req.params;
      const studentId = req.user?.userId;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: '未授权访问'
        });
      }

      const status = await communicationService.getQuestionStatus(questionId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('获取问题状态失败:', error);
      res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        message: '获取问题状态失败'
      });
    }
  }
}

export const communicationController = new CommunicationController();
