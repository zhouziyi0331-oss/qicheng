import { Request, Response } from 'express';
import { unifiedMentorService } from '../services/unifiedMentorService';

export class UnifiedMentorController {
  // 统一对话接口
  async chat(req: Request, res: Response) {
    try {
      const { message, session_id } = req.body;
      const userId = req.user!.id;

      const response = await unifiedMentorService.chat(userId, message, {
        session_id
      });

      res.json({
        success: true,
        data: response
      });
    } catch (err) {
      console.error('对话失败:', err);
      res.status(500).json({
        success: false,
        error: '对话失败'
      });
    }
  }

  // 切换导师模式
  async switchMode(req: Request, res: Response) {
    try {
      const { mode } = req.body;
      const userId = req.user!.id;

      if (!['emotional', 'project', 'hybrid', 'auto'].includes(mode)) {
        return res.status(400).json({
          success: false,
          error: '无效的导师模式'
        });
      }

      const result = await unifiedMentorService.switchMode(userId, mode);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      console.error('切换模式失败:', err);
      res.status(500).json({
        success: false,
        error: '切换模式失败'
      });
    }
  }

  // 获取对话历史
  async getHistory(req: Request, res: Response) {
    try {
      const { session_id } = req.params;
      const { limit } = req.query;
      const userId = req.user!.id;

      const history = await unifiedMentorService.getConversationHistory(
        userId,
        session_id,
        limit ? parseInt(limit as string) : 20
      );

      res.json({
        success: true,
        data: history
      });
    } catch (err) {
      console.error('获取历史失败:', err);
      res.status(500).json({
        success: false,
        error: '获取历史失败'
      });
    }
  }

  // 创建情感-项目关联
  async linkEmotionToProject(req: Request, res: Response) {
    try {
      const {
        emotional_data,
        project_id,
        link_type,
        transformation_story
      } = req.body;
      const userId = req.user!.id;

      const link = await unifiedMentorService.linkEmotionToProject(
        userId,
        emotional_data,
        project_id,
        link_type,
        transformation_story
      );

      res.json({
        success: true,
        data: link
      });
    } catch (err) {
      console.error('创建关联失败:', err);
      res.status(500).json({
        success: false,
        error: '创建关联失败'
      });
    }
  }

  // 获取成长旅程
  async getGrowthJourney(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const journey = await unifiedMentorService.getGrowthJourney(userId);

      res.json({
        success: true,
        data: journey
      });
    } catch (err) {
      console.error('获取成长旅程失败:', err);
      res.status(500).json({
        success: false,
        error: '获取成长旅程失败'
      });
    }
  }
}

export const unifiedMentorController = new UnifiedMentorController();
