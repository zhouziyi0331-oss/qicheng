"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mentorScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = __importDefault(require("../utils/logger"));
const proactiveFollowUpService_1 = require("../services/proactiveFollowUpService");
const mentorMemoryService_1 = __importDefault(require("../services/mentorMemoryService"));
/**
 * AI导师定时任务调度器
 */
class MentorScheduler {
    constructor() {
        this.tasks = new Map();
    }
    /**
     * 启动所有定时任务
     */
    start() {
        logger_1.default.info('启动AI导师定时任务调度器');
        // 1. 主动跟进任务（每小时执行一次）
        this.scheduleFollowUps();
        // 2. 清理过期记忆（每天凌晨3点执行）
        this.scheduleMemoryCleanup();
        // 3. 更新学习模式分析（每6小时执行一次）
        this.scheduleLearningPatternAnalysis();
        logger_1.default.info('所有定时任务已启动', {
            taskCount: this.tasks.size
        });
    }
    /**
     * 停止所有定时任务
     */
    stop() {
        logger_1.default.info('停止AI导师定时任务调度器');
        this.tasks.forEach((task, name) => {
            task.stop();
            logger_1.default.info('定时任务已停止', { taskName: name });
        });
        this.tasks.clear();
    }
    /**
     * 主动跟进任务
     * 每小时执行一次，检查需要跟进的学生
     */
    scheduleFollowUps() {
        const task = node_cron_1.default.schedule('0 * * * *', async () => {
            try {
                logger_1.default.info('开始执行主动跟进任务');
                const result = await proactiveFollowUpService_1.proactiveFollowUpService.executeFollowUps();
                logger_1.default.info('主动跟进任务完成', {
                    total: result.total,
                    sent: result.sent,
                    failed: result.failed
                });
            }
            catch (error) {
                logger_1.default.error('主动跟进任务失败', { error });
            }
        });
        this.tasks.set('followUps', task);
        logger_1.default.info('主动跟进任务已调度', { schedule: '每小时' });
    }
    /**
     * 清理过期记忆
     * 每天凌晨3点执行
     */
    scheduleMemoryCleanup() {
        const task = node_cron_1.default.schedule('0 3 * * *', async () => {
            try {
                logger_1.default.info('开始清理过期记忆');
                const count = await mentorMemoryService_1.default.cleanupExpiredMemories();
                logger_1.default.info('过期记忆清理完成', { deletedCount: count });
            }
            catch (error) {
                logger_1.default.error('清理过期记忆失败', { error });
            }
        });
        this.tasks.set('memoryCleanup', task);
        logger_1.default.info('记忆清理任务已调度', { schedule: '每天凌晨3点' });
    }
    /**
     * 学习模式分析
     * 每6小时执行一次
     */
    scheduleLearningPatternAnalysis() {
        const task = node_cron_1.default.schedule('0 */6 * * *', async () => {
            try {
                logger_1.default.info('开始学习模式分析');
                // 这里可以添加批量分析学习模式的逻辑
                // 例如：分析所有活跃学生的学习模式，更新档案
                logger_1.default.info('学习模式分析完成');
            }
            catch (error) {
                logger_1.default.error('学习模式分析失败', { error });
            }
        });
        this.tasks.set('learningPatternAnalysis', task);
        logger_1.default.info('学习模式分析任务已调度', { schedule: '每6小时' });
    }
    /**
     * 手动触发主动跟进（用于测试）
     */
    async triggerFollowUps() {
        try {
            logger_1.default.info('手动触发主动跟进任务');
            const result = await proactiveFollowUpService_1.proactiveFollowUpService.executeFollowUps();
            logger_1.default.info('手动触发完成', result);
            return result;
        }
        catch (error) {
            logger_1.default.error('手动触发失败', { error });
            throw error;
        }
    }
    /**
     * 获取任务状态
     */
    getStatus() {
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
exports.mentorScheduler = new MentorScheduler();
//# sourceMappingURL=mentorScheduler.js.map