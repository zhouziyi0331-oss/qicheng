import { Request, Response, NextFunction } from 'express';
import SkipLevelService from '../services/skipLevelService';

/**
 * 跳级系统控制器
 */
class SkipLevelController {
  /**
   * 检查跳级资格
   */
  async checkEligibility(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.userId ? parseInt(req.user.userId) : undefined;
      if (!studentId) {
        return res.status(401).json({ error: '未授权' });
      }

      const eligibility = await SkipLevelService.checkEligibility(studentId);
      res.json(eligibility);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 申请跳级
   */
  async applySkipLevel(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.userId ? parseInt(req.user.userId) : undefined;
      const { targetLevel } = req.body;

      if (!studentId) {
        return res.status(401).json({ error: '未授权' });
      }

      if (!targetLevel || typeof targetLevel !== 'number') {
        return res.status(400).json({ error: '目标级别无效' });
      }

      const application = await SkipLevelService.applySkipLevel(studentId, targetLevel);
      res.json(application);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取任务详情
   */
  async getTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const studentId = req.user?.userId ? parseInt(req.user.userId) : undefined;

      if (!studentId) {
        return res.status(401).json({ error: '未授权' });
      }

      const task = await SkipLevelService.getTask(taskId, studentId);
      res.json(task);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 领取任务
   */
  async receiveTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const studentId = req.user?.userId ? parseInt(req.user.userId) : undefined;

      if (!studentId) {
        return res.status(401).json({ error: '未授权' });
      }

      const result = await SkipLevelService.receiveTask(taskId, studentId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取任务进度
   */
  async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const studentId = req.user?.userId ? parseInt(req.user.userId) : undefined;

      if (!studentId) {
        return res.status(401).json({ error: '未授权' });
      }

      const progress = await SkipLevelService.getProgress(taskId, studentId);
      res.json(progress);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新子任务进度
   */
  async updateSubTaskProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId, subTaskId } = req.params;
      const { progress } = req.body;
      const studentId = req.user?.userId ? parseInt(req.user.userId) : undefined;

      if (!studentId) {
        return res.status(401).json({ error: '未授权' });
      }

      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return res.status(400).json({ error: '进度值无效' });
      }

      const result = await SkipLevelService.updateSubTaskProgress(
        taskId,
        parseInt(subTaskId),
        progress,
        studentId
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 提交作品
   */
  async submitWork(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const { type, content } = req.body;
      const studentId = req.user?.userId ? parseInt(req.user.userId) : undefined;

      if (!studentId) {
        return res.status(401).json({ error: '未授权' });
      }

      if (!type || !['image', 'link'].includes(type)) {
        return res.status(400).json({ error: '提交类型无效' });
      }

      if (!Array.isArray(content) || content.length === 0) {
        return res.status(400).json({ error: '内容不能为空' });
      }

      const result = await SkipLevelService.submitWork(taskId, { type, content }, studentId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 申请评分
   */
  async requestScore(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const studentId = req.user?.userId ? parseInt(req.user.userId) : undefined;

      if (!studentId) {
        return res.status(401).json({ error: '未授权' });
      }

      const result = await SkipLevelService.requestScore(taskId, studentId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取评分结果
   */
  async getScore(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const studentId = req.user?.userId ? parseInt(req.user.userId) : undefined;

      if (!studentId) {
        return res.status(401).json({ error: '未授权' });
      }

      const score = await SkipLevelService.getScore(taskId, studentId);
      res.json(score);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取奖励信息
   */
  async getRewards(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const studentId = req.user?.userId ? parseInt(req.user.userId) : undefined;

      if (!studentId) {
        return res.status(401).json({ error: '未授权' });
      }

      const rewards = await SkipLevelService.getRewards(taskId, studentId);
      res.json(rewards);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 领取奖励
   */
  async claimRewards(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const studentId = req.user?.userId ? parseInt(req.user.userId) : undefined;

      if (!studentId) {
        return res.status(401).json({ error: '未授权' });
      }

      const result = await SkipLevelService.claimRewards(taskId, studentId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取改进建议
   */
  async getImprovementGuide(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskId } = req.params;
      const studentId = req.user?.userId ? parseInt(req.user.userId) : undefined;

      if (!studentId) {
        return res.status(401).json({ error: '未授权' });
      }

      const guide = await SkipLevelService.getImprovementGuide(taskId, studentId);
      res.json(guide);
    } catch (error) {
      next(error);
    }
  }
}

export default new SkipLevelController();
