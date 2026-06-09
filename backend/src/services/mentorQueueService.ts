import redis from '../utils/redis';
import logger from '../utils/logger';
import mentorTriggerService from './mentorTriggerService';

/**
 * 导师触发队列服务
 * 使用Redis实现延迟任务队列，替代setTimeout
 *
 * 优势：
 * 1. 持久化：服务器重启不会丢失任务
 * 2. 可靠性：任务执行失败可以重试
 * 3. 可观测：可以查看队列状态
 */

interface MentorJob {
  taskId: string;
  studentId: string;
  stage: 'requirement_understanding' | 'execution_guidance' | 'quality_review' | 'communication_bridge' | 'growth_summary';
  scheduledAt: number; // Unix timestamp in milliseconds
  retryCount?: number;
}

const QUEUE_KEY = 'mentor:delayed_jobs';
const PROCESSING_KEY = 'mentor:processing';
const MAX_RETRIES = 3;

class MentorQueueService {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * 启动队列处理器
   */
  async start(): Promise<void> {
    if (this.isProcessing) {
      logger.warn('Mentor queue processor already running');
      return;
    }

    this.isProcessing = true;
    logger.info('Starting mentor queue processor');

    // 每秒检查一次是否有到期的任务
    this.processingInterval = setInterval(() => {
      this.processJobs().catch(err => {
        logger.error('Error processing mentor jobs', { error: err.message });
      });
    }, 1000);
  }

  /**
   * 停止队列处理器
   */
  async stop(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    logger.info('Stopped mentor queue processor');
  }

  /**
   * 添加延迟任务到队列
   * @param job 任务信息
   * @param delayMs 延迟时间（毫秒）
   */
  async scheduleJob(job: Omit<MentorJob, 'scheduledAt' | 'retryCount'>, delayMs: number): Promise<void> {
    const scheduledAt = Date.now() + delayMs;
    const fullJob: MentorJob = {
      ...job,
      scheduledAt,
      retryCount: 0,
    };

    // 使用sorted set存储，score为执行时间
    await redis.zadd(QUEUE_KEY, scheduledAt, JSON.stringify(fullJob));

    logger.info('Mentor job scheduled', {
      taskId: job.taskId,
      studentId: job.studentId,
      stage: job.stage,
      delayMs,
      scheduledAt: new Date(scheduledAt).toISOString(),
    });
  }

  /**
   * 处理到期的任务
   */
  private async processJobs(): Promise<void> {
    const now = Date.now();

    // 获取所有到期的任务（score <= now）
    const jobs = await redis.zrangebyscore(QUEUE_KEY, '-inf', now);

    if (jobs.length === 0) {
      return;
    }

    logger.info(`Processing ${jobs.length} mentor jobs`);

    for (const jobStr of jobs) {
      try {
        const job: MentorJob = JSON.parse(jobStr);

        // 检查是否正在处理（防止重复执行）
        const lockKey = `${PROCESSING_KEY}:${job.taskId}:${job.studentId}:${job.stage}`;
        const locked = await redis.set(lockKey, '1', 'EX', 60, 'NX');

        if (locked !== 'OK') {
          logger.warn('Job already processing, skipping', { job });
          continue;
        }

        // 执行任务
        await this.executeJob(job);

        // 从队列中移除
        await redis.zrem(QUEUE_KEY, jobStr);

        // 释放锁
        await redis.del(lockKey);

        logger.info('Mentor job completed', {
          taskId: job.taskId,
          studentId: job.studentId,
          stage: job.stage,
        });
      } catch (error: any) {
        logger.error('Error executing mentor job', {
          job: jobStr,
          error: error.message,
        });

        // 重试逻辑
        try {
          const job: MentorJob = JSON.parse(jobStr);
          await this.handleJobFailure(job, jobStr, error);
        } catch (retryError: any) {
          logger.error('Error handling job failure', { error: retryError.message });
        }
      }
    }
  }

  /**
   * 执行具体的导师触发任务
   */
  private async executeJob(job: MentorJob): Promise<void> {
    const { taskId, studentId, stage } = job;

    switch (stage) {
      case 'requirement_understanding':
        await mentorTriggerService.triggerRequirementUnderstanding(taskId, studentId);
        break;
      case 'execution_guidance':
        await mentorTriggerService.triggerExecutionGuidance(taskId, studentId);
        break;
      case 'quality_review':
        await mentorTriggerService.triggerQualityReview(taskId, studentId);
        break;
      case 'communication_bridge':
        await mentorTriggerService.triggerCommunicationBridge(taskId, studentId);
        break;
      case 'growth_summary':
        await mentorTriggerService.triggerGrowthSummary(taskId, studentId);
        break;
      default:
        throw new Error(`Unknown mentor stage: ${stage}`);
    }
  }

  /**
   * 处理任务失败
   */
  private async handleJobFailure(job: MentorJob, jobStr: string, error: Error): Promise<void> {
    const retryCount = (job.retryCount || 0) + 1;

    if (retryCount >= MAX_RETRIES) {
      logger.error('Mentor job failed after max retries', {
        taskId: job.taskId,
        studentId: job.studentId,
        stage: job.stage,
        retryCount,
        error: error.message,
      });

      // 从队列中移除
      await redis.zrem(QUEUE_KEY, jobStr);

      // TODO: 记录到失败队列或发送告警
      return;
    }

    // 重试：延迟时间指数增长（1分钟、2分钟、4分钟）
    const retryDelayMs = Math.pow(2, retryCount - 1) * 60 * 1000;
    const newScheduledAt = Date.now() + retryDelayMs;

    const retryJob: MentorJob = {
      ...job,
      scheduledAt: newScheduledAt,
      retryCount,
    };

    // 移除旧任务
    await redis.zrem(QUEUE_KEY, jobStr);

    // 添加重试任务
    await redis.zadd(QUEUE_KEY, newScheduledAt, JSON.stringify(retryJob));

    logger.warn('Mentor job scheduled for retry', {
      taskId: job.taskId,
      studentId: job.studentId,
      stage: job.stage,
      retryCount,
      retryDelayMs,
      newScheduledAt: new Date(newScheduledAt).toISOString(),
    });
  }

  /**
   * 获取队列状态
   */
  async getQueueStatus(): Promise<{
    pendingCount: number;
    processingCount: number;
    upcomingJobs: MentorJob[];
  }> {
    const pendingCount = await redis.zcard(QUEUE_KEY);
    const processingKeys = await redis.keys(`${PROCESSING_KEY}:*`);
    const processingCount = processingKeys.length;

    // 获取接下来10个任务
    const upcomingJobsStr = await redis.zrange(QUEUE_KEY, 0, 9);
    const upcomingJobs = upcomingJobsStr.map(str => JSON.parse(str));

    return {
      pendingCount,
      processingCount,
      upcomingJobs,
    };
  }

  /**
   * 清空队列（仅用于测试）
   */
  async clearQueue(): Promise<void> {
    await redis.del(QUEUE_KEY);
    const processingKeys = await redis.keys(`${PROCESSING_KEY}:*`);
    if (processingKeys.length > 0) {
      await redis.del(...processingKeys);
    }
    logger.info('Mentor queue cleared');
  }
}

export default new MentorQueueService();
