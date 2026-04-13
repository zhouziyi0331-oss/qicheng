"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const autoConfirmationJob_1 = require("./autoConfirmationJob");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 定时任务调度器
 * 管理所有定时任务的启动和停止
 */
class CronScheduler {
    constructor(pool) {
        this.tasks = [];
        this.pool = pool;
    }
    /**
     * 启动所有定时任务
     */
    start() {
        logger_1.default.info('启动定时任务调度器');
        // 启动7天自动确认任务
        this.startAutoConfirmationJob();
        logger_1.default.info(`已启动${this.tasks.length}个定时任务`);
    }
    /**
     * 停止所有定时任务
     */
    stop() {
        logger_1.default.info('停止定时任务调度器');
        this.tasks.forEach(task => {
            task.stop();
        });
        this.tasks = [];
        logger_1.default.info('所有定时任务已停止');
    }
    /**
     * 启动7天自动确认任务
     */
    startAutoConfirmationJob() {
        const job = new autoConfirmationJob_1.AutoConfirmationJob(this.pool);
        const schedule = autoConfirmationJob_1.AutoConfirmationJob.getCronSchedule();
        logger_1.default.info(`注册7天自动确认任务，执行时间: ${schedule}`);
        const task = node_cron_1.default.schedule(schedule, async () => {
            try {
                logger_1.default.info('开始执行7天自动确认任务');
                await job.execute();
                logger_1.default.info('7天自动确认任务执行完成');
            }
            catch (err) {
                logger_1.default.error('7天自动确认任务执行失败:', err);
            }
        }, {
            timezone: 'Asia/Shanghai'
        });
        this.tasks.push(task);
        // 开发环境下，可以立即执行一次用于测试
        if (process.env.NODE_ENV === 'development') {
            logger_1.default.info('开发环境：立即执行一次7天自动确认任务（测试）');
            job.execute().catch(err => {
                logger_1.default.error('测试执行失败:', err);
            });
        }
    }
    /**
     * 手动触发7天自动确认任务（用于测试）
     */
    async triggerAutoConfirmation() {
        logger_1.default.info('手动触发7天自动确认任务');
        const job = new autoConfirmationJob_1.AutoConfirmationJob(this.pool);
        await job.execute();
    }
}
exports.CronScheduler = CronScheduler;
//# sourceMappingURL=scheduler.js.map