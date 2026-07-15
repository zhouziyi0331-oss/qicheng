"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const autoConfirmationJob_1 = require("./autoConfirmationJob");
const autoAcceptanceJob_1 = require("./autoAcceptanceJob");
const taskExpirationJob_1 = require("./taskExpirationJob");
const applicationTimeoutJob_1 = require("./applicationTimeoutJob");
const reportGenerationJobs_1 = require("./reportGenerationJobs");
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
        // 启动48小时自动确认任务
        this.startAutoAcceptanceJob();
        // 启动任务过期处理任务
        this.startTaskExpirationJob();
        // 启动申请超时取消任务
        this.startApplicationTimeoutJob();
        // Phase R5.3: 启动每周报告生成任务
        this.startWeeklyReportJob();
        // Phase R5.3: 启动每月报告生成任务
        this.startMonthlyReportJob();
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
     * 启动48小时自动确认任务
     */
    startAutoAcceptanceJob() {
        const job = new autoAcceptanceJob_1.AutoAcceptanceJob(this.pool);
        const schedule = autoAcceptanceJob_1.AutoAcceptanceJob.getCronSchedule();
        const task = node_cron_1.default.schedule(schedule, async () => {
            try {
                await job.execute();
            }
            catch (error) {
                logger_1.default.error('48小时自动确认任务执行失败:', error);
            }
        });
        this.tasks.push(task);
        logger_1.default.info(`已启动48小时自动确认任务，调度时间: ${schedule}`);
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
     * 启动任务过期处理任务
     */
    startTaskExpirationJob() {
        const job = new taskExpirationJob_1.TaskExpirationJob(this.pool);
        const schedule = taskExpirationJob_1.TaskExpirationJob.getCronSchedule();
        const task = node_cron_1.default.schedule(schedule, async () => {
            try {
                await job.execute();
            }
            catch (error) {
                logger_1.default.error('任务过期处理执行失败:', error);
            }
        });
        this.tasks.push(task);
        logger_1.default.info(`已启动任务过期处理任务，调度时间: ${schedule}`);
    }
    /**
     * 启动申请超时取消任务
     */
    startApplicationTimeoutJob() {
        const job = new applicationTimeoutJob_1.ApplicationTimeoutJob(this.pool);
        const schedule = applicationTimeoutJob_1.ApplicationTimeoutJob.getCronSchedule();
        const task = node_cron_1.default.schedule(schedule, async () => {
            try {
                await job.execute();
            }
            catch (error) {
                logger_1.default.error('申请超时取消任务执行失败:', error);
            }
        });
        this.tasks.push(task);
        logger_1.default.info(`已启动申请超时取消任务，调度时间: ${schedule}`);
    }
    /**
     * 手动触发7天自动确认任务（用于测试）
     */
    async triggerAutoConfirmation() {
        logger_1.default.info('手动触发7天自动确认任务');
        const job = new autoConfirmationJob_1.AutoConfirmationJob(this.pool);
        await job.execute();
    }
    /**
     * Phase R5.3: 启动每周报告生成任务
     */
    startWeeklyReportJob() {
        const job = new reportGenerationJobs_1.WeeklyReportJob(this.pool);
        const schedule = reportGenerationJobs_1.WeeklyReportJob.getCronSchedule();
        const task = node_cron_1.default.schedule(schedule, async () => {
            try {
                await job.execute();
            }
            catch (error) {
                logger_1.default.error('每周报告生成任务执行失败:', error);
            }
        }, {
            timezone: 'Asia/Shanghai'
        });
        this.tasks.push(task);
        logger_1.default.info(`已启动每周报告生成任务，调度时间: ${schedule}`);
    }
    /**
     * Phase R5.3: 启动每月报告生成任务
     */
    startMonthlyReportJob() {
        const job = new reportGenerationJobs_1.MonthlyReportJob(this.pool);
        const schedule = reportGenerationJobs_1.MonthlyReportJob.getCronSchedule();
        const task = node_cron_1.default.schedule(schedule, async () => {
            try {
                await job.execute();
            }
            catch (error) {
                logger_1.default.error('每月报告生成任务执行失败:', error);
            }
        }, {
            timezone: 'Asia/Shanghai'
        });
        this.tasks.push(task);
        logger_1.default.info(`已启动每月报告生成任务，调度时间: ${schedule}`);
    }
}
exports.CronScheduler = CronScheduler;
//# sourceMappingURL=scheduler.js.map