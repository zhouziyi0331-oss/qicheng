"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = __importDefault(require("../utils/redis"));
const logger_1 = __importDefault(require("../utils/logger"));
const mentorTriggerService_1 = require("./mentorTriggerService");
const QUEUE_KEY = 'mentor:delayed_jobs';
const PROCESSING_KEY = 'mentor:processing';
const MAX_RETRIES = 3;
class MentorQueueService {
    constructor() {
        this.isProcessing = false;
        this.processingInterval = null;
    }
    /**
     * 启动队列处理器
     */
    async start() {
        if (this.isProcessing) {
            logger_1.default.warn('Mentor queue processor already running');
            return;
        }
        this.isProcessing = true;
        logger_1.default.info('Starting mentor queue processor');
        // 每秒检查一次是否有到期的任务
        this.processingInterval = setInterval(() => {
            this.processJobs().catch(err => {
                logger_1.default.error('Error processing mentor jobs', { error: err.message });
            });
        }, 1000);
    }
    /**
     * 停止队列处理器
     */
    async stop() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        this.isProcessing = false;
        logger_1.default.info('Stopped mentor queue processor');
    }
    /**
     * 添加延迟任务到队列
     * @param job 任务信息
     * @param delayMs 延迟时间（毫秒）
     */
    async scheduleJob(job, delayMs) {
        const scheduledAt = Date.now() + delayMs;
        const fullJob = {
            ...job,
            scheduledAt,
            retryCount: 0,
        };
        // 使用sorted set存储，score为执行时间
        await redis_1.default.zadd(QUEUE_KEY, scheduledAt, JSON.stringify(fullJob));
        logger_1.default.info('Mentor job scheduled', {
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
    async processJobs() {
        const now = Date.now();
        // 获取所有到期的任务（score <= now）
        const jobs = await redis_1.default.zrangebyscore(QUEUE_KEY, '-inf', now);
        if (jobs.length === 0) {
            return;
        }
        logger_1.default.info(`Processing ${jobs.length} mentor jobs`);
        for (const jobStr of jobs) {
            try {
                const job = JSON.parse(jobStr);
                // 检查是否正在处理（防止重复执行）
                const lockKey = `${PROCESSING_KEY}:${job.taskId}:${job.studentId}:${job.stage}`;
                const locked = await redis_1.default.set(lockKey, '1', 'EX', 60, 'NX');
                if (locked !== 'OK') {
                    logger_1.default.warn('Job already processing, skipping', { job });
                    continue;
                }
                // 执行任务
                await this.executeJob(job);
                // 从队列中移除
                await redis_1.default.zrem(QUEUE_KEY, jobStr);
                // 释放锁
                await redis_1.default.del(lockKey);
                logger_1.default.info('Mentor job completed', {
                    taskId: job.taskId,
                    studentId: job.studentId,
                    stage: job.stage,
                });
            }
            catch (error) {
                logger_1.default.error('Error executing mentor job', {
                    job: jobStr,
                    error: error.message,
                });
                // 重试逻辑
                try {
                    const job = JSON.parse(jobStr);
                    await this.handleJobFailure(job, jobStr, error);
                }
                catch (retryError) {
                    logger_1.default.error('Error handling job failure', { error: retryError.message });
                }
            }
        }
    }
    /**
     * 执行具体的导师触发任务
     */
    async executeJob(job) {
        const { taskId, studentId, stage } = job;
        switch (stage) {
            case 'requirement_understanding':
                await mentorTriggerService_1.mentorTriggerService.triggerRequirementUnderstanding(taskId, studentId);
                break;
            case 'execution_guidance':
                await mentorTriggerService_1.mentorTriggerService.triggerExecutionGuidance(taskId, studentId);
                break;
            case 'quality_review':
                await mentorTriggerService_1.mentorTriggerService.triggerQualityReview(taskId, studentId);
                break;
            case 'communication_bridge':
                await mentorTriggerService_1.mentorTriggerService.triggerCommunicationBridge(taskId, studentId);
                break;
            case 'growth_summary':
                await mentorTriggerService_1.mentorTriggerService.triggerGrowthSummary(taskId, studentId);
                break;
            default:
                throw new Error(`Unknown mentor stage: ${stage}`);
        }
    }
    /**
     * 处理任务失败
     */
    async handleJobFailure(job, jobStr, error) {
        const retryCount = (job.retryCount || 0) + 1;
        if (retryCount >= MAX_RETRIES) {
            logger_1.default.error('Mentor job failed after max retries', {
                taskId: job.taskId,
                studentId: job.studentId,
                stage: job.stage,
                retryCount,
                error: error.message,
            });
            // 从队列中移除
            await redis_1.default.zrem(QUEUE_KEY, jobStr);
            // TODO: 记录到失败队列或发送告警
            return;
        }
        // 重试：延迟时间指数增长（1分钟、2分钟、4分钟）
        const retryDelayMs = Math.pow(2, retryCount - 1) * 60 * 1000;
        const newScheduledAt = Date.now() + retryDelayMs;
        const retryJob = {
            ...job,
            scheduledAt: newScheduledAt,
            retryCount,
        };
        // 移除旧任务
        await redis_1.default.zrem(QUEUE_KEY, jobStr);
        // 添加重试任务
        await redis_1.default.zadd(QUEUE_KEY, newScheduledAt, JSON.stringify(retryJob));
        logger_1.default.warn('Mentor job scheduled for retry', {
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
    async getQueueStatus() {
        const pendingCount = await redis_1.default.zcard(QUEUE_KEY);
        const processingKeys = await redis_1.default.keys(`${PROCESSING_KEY}:*`);
        const processingCount = processingKeys.length;
        // 获取接下来10个任务
        const upcomingJobsStr = await redis_1.default.zrange(QUEUE_KEY, 0, 9);
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
    async clearQueue() {
        await redis_1.default.del(QUEUE_KEY);
        const processingKeys = await redis_1.default.keys(`${PROCESSING_KEY}:*`);
        if (processingKeys.length > 0) {
            await redis_1.default.del(...processingKeys);
        }
        logger_1.default.info('Mentor queue cleared');
    }
}
exports.default = new MentorQueueService();
//# sourceMappingURL=mentorQueueService.js.map