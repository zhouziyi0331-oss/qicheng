"use strict";
/**
 * 定时任务：邀请系统维护
 * 1. 每小时检测过期邀请
 * 2. 每天凌晨检测不活跃学生
 * 3. 每周一重置周统计
 * 4. 每月1号重置月统计
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const invitationService_1 = require("../services/invitation/invitationService");
const activityService_1 = require("../services/invitation/activityService");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * 每小时检测过期邀请
 */
node_cron_1.default.schedule('0 * * * *', async () => {
    try {
        logger_1.default.info('开始检测过期邀请...');
        const count = await invitationService_1.invitationTaskService.expireInvitations();
        logger_1.default.info(`过期邀请检测完成，已过期${count}个邀请`);
    }
    catch (error) {
        logger_1.default.error('过期邀请检测失败:', error);
    }
});
/**
 * 每天凌晨2点检测不活跃学生（7天未登录）
 */
node_cron_1.default.schedule('0 2 * * *', async () => {
    try {
        logger_1.default.info('开始检测不活跃学生...');
        const count = await activityService_1.activityService.detectInactiveStudents();
        logger_1.default.info(`不活跃学生检测完成，已标记${count}个学生为不活跃`);
    }
    catch (error) {
        logger_1.default.error('不活跃学生检测失败:', error);
    }
});
/**
 * 每周一凌晨3点重置周统计
 */
node_cron_1.default.schedule('0 3 * * 1', async () => {
    try {
        logger_1.default.info('开始重置周统计...');
        await activityService_1.activityService.resetWeeklyStats();
        logger_1.default.info('周统计重置完成');
    }
    catch (error) {
        logger_1.default.error('周统计重置失败:', error);
    }
});
/**
 * 每月1号凌晨4点重置月统计
 */
node_cron_1.default.schedule('0 4 1 * *', async () => {
    try {
        logger_1.default.info('开始重置月统计...');
        await activityService_1.activityService.resetMonthlyStats();
        logger_1.default.info('月统计重置完成');
    }
    catch (error) {
        logger_1.default.error('月统计重置失败:', error);
    }
});
logger_1.default.info('邀请系统定时任务已启动');
//# sourceMappingURL=invitationCron.js.map