"use strict";
/**
 * Phase R5.3: 定期报告生成任务
 * 每周和每月自动生成报告
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyReportJob = exports.WeeklyReportJob = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const reportTriggerService_1 = __importDefault(require("../services/reportTriggerService"));
/**
 * 每周报告生成任务
 * 每周一早上8点执行
 */
class WeeklyReportJob {
    constructor(pool) {
        this.pool = pool;
    }
    /**
     * 获取Cron表达式
     * 每周一 8:00 AM
     */
    static getCronSchedule() {
        return '0 8 * * 1'; // 每周一早上8点
    }
    /**
     * 执行任务
     */
    async execute() {
        const startTime = Date.now();
        try {
            logger_1.default.info('[每周报告] 开始执行每周报告生成任务');
            // 调用报告触发服务
            await reportTriggerService_1.default.generateWeeklyReports();
            const duration = Date.now() - startTime;
            logger_1.default.info(`[每周报告] 任务执行完成，耗时: ${duration}ms`);
        }
        catch (error) {
            logger_1.default.error('[每周报告] 任务执行失败:', error);
            throw error;
        }
    }
}
exports.WeeklyReportJob = WeeklyReportJob;
/**
 * 每月报告生成任务
 * 每月1号早上8点执行
 */
class MonthlyReportJob {
    constructor(pool) {
        this.pool = pool;
    }
    /**
     * 获取Cron表达式
     * 每月1号 8:00 AM
     */
    static getCronSchedule() {
        return '0 8 1 * *'; // 每月1号早上8点
    }
    /**
     * 执行任务
     */
    async execute() {
        const startTime = Date.now();
        try {
            logger_1.default.info('[每月报告] 开始执行每月报告生成任务');
            // 调用报告触发服务
            await reportTriggerService_1.default.generateMonthlyReports();
            const duration = Date.now() - startTime;
            logger_1.default.info(`[每月报告] 任务执行完成，耗时: ${duration}ms`);
        }
        catch (error) {
            logger_1.default.error('[每月报告] 任务执行失败:', error);
            throw error;
        }
    }
}
exports.MonthlyReportJob = MonthlyReportJob;
//# sourceMappingURL=reportGenerationJobs.js.map