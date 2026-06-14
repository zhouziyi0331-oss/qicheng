import { Router, Request, Response } from 'express';
import logger from '../utils/logger';
import { CommunicationService } from '../services/communicationService';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';

const router = Router();

/**
 * 企业添加任务补充说明
 * POST /api/v1/communication/clarifications
 */
router.post('/clarifications', authenticate, requireRole('company'), async (req: Request, res: Response) => {
  try {
    const { taskId, content, attachments } = req.body;
    const companyId = (req.user as any).userId;

    if (!taskId || !content) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const clarification = await CommunicationService.addClarification(taskId, companyId, content, attachments);
    res.json({ success: true, data: clarification });
  } catch (error: any) {
    logger.error('添加补充说明失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 获取任务的补充说明列表
 * GET /api/v1/communication/clarifications/:taskId
 */
router.get('/clarifications/:taskId', authenticate, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const clarifications = await CommunicationService.getClarifications(parseInt(taskId));
    res.json({ success: true, data: clarifications });
  } catch (error: any) {
    logger.error('获取补充说明失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 学生提问（AI回答）
 * POST /api/v1/communication/questions
 */
router.post('/questions', authenticate, requireRole('student'), async (req: Request, res: Response) => {
  try {
    const { taskId, question } = req.body;
    const studentId = (req.user as any).userId;

    if (!taskId || !question) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const result = await CommunicationService.askQuestion(taskId, studentId, question);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('提问失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 转发问题给企业
 * POST /api/v1/communication/questions/:questionId/forward
 */
router.post('/questions/:questionId/forward', authenticate, requireRole('student'), async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const studentId = (req.user as any).userId;

    const result = await CommunicationService.forwardToCompany(parseInt(questionId), studentId);
    res.json(result);
  } catch (error: any) {
    logger.error('转发问题失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 企业回答学生问题
 * POST /api/v1/communication/questions/:questionId/answer
 */
router.post('/questions/:questionId/answer', authenticate, requireRole('company'), async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;
    const companyId = (req.user as any).userId;

    if (!answer) {
      return res.status(400).json({ error: '回答内容不能为空' });
    }

    const result = await CommunicationService.answerQuestion(parseInt(questionId), companyId, answer);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('回答问题失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 获取任务的问答列表
 * GET /api/v1/communication/questions/:taskId
 */
router.get('/questions/:taskId', authenticate, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = (req.user as any).userId;
    const userRole = (req.user as any).role;

    const questions = await CommunicationService.getQuestions(parseInt(taskId), userId, userRole);
    res.json({ success: true, data: questions });
  } catch (error: any) {
    logger.error('获取问答列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 标记AI回答是否有帮助
 * POST /api/v1/communication/questions/:questionId/helpful
 */
router.post('/questions/:questionId/helpful', authenticate, async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const { isHelpful } = req.body;

    const result = await CommunicationService.markAIAnswerHelpful(parseInt(questionId), isHelpful);
    res.json(result);
  } catch (error: any) {
    logger.error('标记失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 发送中转消息
 * POST /api/v1/communication/messages
 */
router.post('/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const { taskId, receiverId, content, attachments } = req.body;
    const senderId = (req.user as any).userId;

    if (!taskId || !receiverId || !content) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const result = await CommunicationService.sendRelayMessage(taskId, senderId, receiverId, content, attachments);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('发送消息失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 获取中转消息列表
 * GET /api/v1/communication/messages/:taskId
 */
router.get('/messages/:taskId', authenticate, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = (req.user as any).userId;

    const messages = await CommunicationService.getRelayMessages(parseInt(taskId), userId);
    res.json({ success: true, data: messages });
  } catch (error: any) {
    logger.error('获取消息列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 获取未读消息数
 * GET /api/v1/communication/unread-count
 */
router.get('/unread-count', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const count = await CommunicationService.getUnreadCount(userId);
    res.json({ success: true, data: { count } });
  } catch (error: any) {
    logger.error('获取未读数失败:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
