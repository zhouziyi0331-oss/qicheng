"use strict";
/**
 * AI导师预警定时任务
 *
 * 功能：
 * 1. 每15分钟扫描一次风险条件
 * 2. 触发主动预警消息
 * 3. 记录扫描日志
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const mentorAlertService_1 = __importDefault(require("../services/mentorAlertService"));
const logger_1 = __importDefault(require("../utils/logger"));
class MentorAlertJob {
    constructor() {
        this.job = null;
    }
    /**
     * 启动定时任务
     */
    start() {
        // 每15分钟执行一次：*/15 * * * *
        this.job = node_cron_1.default.schedule('*/15 * * * *', async () => {
            try {
                logger_1.default.info('[MentorAlertJob] 开始执行预警扫描');
                const startTime = Date.now();
                await mentorAlertService_1.default.scanAndTriggerAlerts();
                const duration = Date.now() - startTime;
                logger_1.default.info(`[MentorAlertJob] 预警扫描完成，耗时 ${duration}ms`);
            }
            catch (error) {
                logger_1.default.error('[MentorAlertJob] 预警扫描失败:', error);
            }
        });
        logger_1.default.info('[MentorAlertJob] 定时任务已启动，每15分钟执行一次');
    }
    /**
     * 停止定时任务
     */
    stop() {
        if (this.job) {
            this.job.stop();
            logger_1.default.info('[MentorAlertJob] 定时任务已停止');
        }
    }
    /**
     * 手动触发一次扫描（用于测试）
     */
    async triggerManually() {
        try {
            logger_1.default.info('[MentorAlertJob] 手动触发预警扫描');
            await mentorAlertService_1.default.scanAndTriggerAlerts();
            logger_1.default.info('[MentorAlertJob] 手动扫描完成');
        }
        catch (error) {
            logger_1.default.error('[MentorAlertJob] 手动扫描失败:', error);
            throw error;
        }
    }
}
exports.default = new MentorAlertJob();
//# sourceMappingURL=mentorAlertJob.js.map