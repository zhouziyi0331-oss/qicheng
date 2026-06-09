import { Router, Request, Response, NextFunction } from 'express';
import { qaService } from '../services/qaService';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/qa/ask
 * 学生提问，获取苏格拉底式引导回答
 */
router.post(
  '/ask',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user?.userId;
      const { taskId, question, conversationHistory } = req.body;

      if (!studentId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      if (!taskId || !question) {
        return res.status(400).json({
          success: false,
          message: 'taskId and question are required',
        });
      }

      const result = await qaService.answerQuestion({
        studentId,
        taskId,
        question,
        conversationHistory: conversationHistory || [],
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/qa/conversations/:conversationId
 * 获取对话历史
 */
router.get(
  '/conversations/:conversationId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;

      const conversation = await qaService.getConversationHistory(conversationId);

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/qa/conversations/student/:studentId/task/:taskId
 * 获取学生在特定任务的对话历史
 */
router.get(
  '/conversations/student/:studentId/task/:taskId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId, taskId } = req.params;

      // 验证用户只能查看自己的对话历史
      if (req.user?.userId !== studentId && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own conversation history',
        });
      }

      const conversation = await qaService.getConversationByStudentAndTask(studentId, taskId);

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
