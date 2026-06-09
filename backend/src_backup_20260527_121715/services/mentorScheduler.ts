import cron from 'node-cron';
import { logger } from '../utils/logger';
import { proactiveFollowUpService } from '../services/proactiveFollowUpService';
import { mentorMemoryService } from '../services/mentorMemoryService';

/**
 * AI导师定时任务调度器
 */
class MentorScheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  /**
   * 启动所有定时任务
   */
  start(): void {
    logger.info('启动AI导师定时任务调度器');

    // 1. 主动跟进任务（每小时执行一次）
    this.scheduleFollowUps();

    // 2. 清理过期记忆（每天凌晨3点执行）
    this.scheduleMemoryCleanup();

    // 3. 更新学习模式分析（每6小时执行一次）
    this.scheduleLearningPatternAnalysis();

    logger.info('所有定时任务已启动', {
      taskCount: this.tasks.size
    });
  }

  /**
   * 停止所有定时任务
   */
  stop(): void {
    logger.info('停止AI导师定时任务调度器');

    this.tasks.forEach((task, name) => {
      task.stop();
      logger.info('定时任务已停止', { taskName: name });
    });

    this.tasks.clear();
  }

  /**
   * 主动跟进任务
   * 每小时执行一次，检查需要跟进的学生
   */
  private scheduleFollowUps(): void {
    const task = cron.schedule('0 * * * *', async () => {
      try {
        logger.info('开始执行主动跟进任务');

        const result = await proactiveFollowUpService.executeFollowUps();

        logger.info('主动跟进任务完成', {
          total: result.total,
          sent: result.sent,
          failed: result.failed
        });
      } catch (error) {
        logger.error('主动跟进任务失败', { error });
      }
    });

    this.tasks.set('followUps', task);
    logger.info('主动跟进任务已调度', { schedule: '每小时' });
  }

  /**
   * 清理过期记忆
   * 每天凌晨3点执行
   */
  private scheduleMemoryCleanup(): void {
    const task = cron.schedule('0 3 * * *', async () => {
      try {
        logger.info('开始清理过期记忆');

        const count = await mentorMemoryService.cleanupExpiredMemories();

        logger.info('过期记忆清理完成', { deletedCount: count });
      } catch (error) {
        logger.error('清理过期记忆失败', { error });
      }
    });

    this.tasks.set('memoryCleanup', task);
    logger.info('记忆清理任务已调度', { schedule: '每天凌晨3点' });
  }

  /**
   * 学习模式分析
   * 每6小时执行一次
   */
  private scheduleLearningPatternAnalysis(): void {
    const task = cron.schedule('0 */6 * * *', async () => {
      try {
        logger.info('开始学习模式分析');

        // 这里可以添加批量分析学习模式的逻辑
        // 例如：分析所有活跃学生的学习模式，更新档案

        logger.info('学习模式分析完成');
      } catch (error) {
        logger.error('学习模式分析失败', { error });
      }
    });

    this.tasks.set('learningPatternAnalysis', task);
    logger.info('学习模式分析任务已调度', { schedule: '每6小时' });
  }

  /**
   * 手动触发主动跟进（用于测试）
   */
  async triggerFollowUps(): Promise<any> {
    try {
      logger.info('手动触发主动跟进任务');
      const result = await proactiveFollowUpService.executeFollowUps();
      logger.info('手动触发完成', result);
      return result;
    } catch (error) {
      logger.error('手动触发失败', { error });
      throw error;
    }
  }

  /**
   * 获取任务状态
   */
  getStatus(): {
    running: boolean;
    tasks: Array<{ name: string; schedule: string }>;
  } {
    return {
      running: this.tasks.size > 0,
      tasks: [
        { name: 'followUps', schedule: '每小时' },
        { name: 'memoryCleanup', schedule: '每天凌晨3点' },
        { name: 'learningPatternAnalysis', schedule: '每6小时' }
      ]
    };
  }
}

export const mentorScheduler = new MentorScheduler();
