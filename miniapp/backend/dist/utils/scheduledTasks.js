"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledTasks = exports.ScheduledTasks = void 0;
const DecompositionReport_1 = require("../models/DecompositionReport");
const PracticeProject_1 = require("../models/PracticeProject");
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
/**
 * 定时任务管理器
 */
class ScheduledTasks {
    constructor() {
        this.intervals = [];
    }
    /**
     * 启动所有定时任务
     */
    start() {
        console.log('✓ 启动定时任务...');
        // 每小时清理未完成的生成任务
        this.intervals.push(setInterval(() => {
            this.cleanupStaleReports();
        }, 60 * 60 * 1000));
        // 每天凌晨3点生成统计报表
        this.intervals.push(setInterval(() => {
            const now = new Date();
            if (now.getHours() === 3) {
                this.generateDailyStats();
            }
        }, 60 * 60 * 1000));
        console.log('✓ 定时任务已启动');
    }
    /**
     * 清理超过1小时仍未完成的生成任务
     */
    async cleanupStaleReports() {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const result = await DecompositionReport_1.DecompositionReport.updateMany({
                status: 'generating',
                createdAt: { $lt: oneHourAgo }
            }, {
                status: 'failed'
            });
            if (result.modifiedCount > 0) {
                logger_1.log.info(`清理了 ${result.modifiedCount} 个超时的生成任务`);
            }
        }
        catch (error) {
            logger_1.log.error('清理超时任务失败', { error });
        }
    }
    /**
     * 生成每日统计报表
     */
    async generateDailyStats() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            // 统计今日数据
            const [newUsers, completedProjects, generatedReports, unlockedReports] = await Promise.all([
                User_1.User.countDocuments({
                    createdAt: { $gte: today, $lt: tomorrow }
                }),
                PracticeProject_1.PracticeProject.countDocuments({
                    status: 'completed',
                    endDate: { $gte: today, $lt: tomorrow }
                }),
                DecompositionReport_1.DecompositionReport.countDocuments({
                    createdAt: { $gte: today, $lt: tomorrow }
                }),
                DecompositionReport_1.DecompositionReport.countDocuments({
                    isUnlocked: true,
                    unlockedAt: { $gte: today, $lt: tomorrow }
                })
            ]);
            const revenue = unlockedReports * 29.9;
            const stats = {
                date: today.toISOString().split('T')[0],
                newUsers,
                completedProjects,
                generatedReports,
                unlockedReports,
                revenue: `¥${revenue.toFixed(2)}`
            };
            logger_1.log.info('每日统计报表', stats);
            console.log('\n📊 每日统计报表:');
            console.log(`日期: ${stats.date}`);
            console.log(`新增用户: ${newUsers}`);
            console.log(`完成项目: ${completedProjects}`);
            console.log(`生成报告: ${generatedReports}`);
            console.log(`解锁报告: ${unlockedReports}`);
            console.log(`收入: ${stats.revenue}\n`);
        }
        catch (error) {
            logger_1.log.error('生成每日统计失败', { error });
        }
    }
    /**
     * 停止所有定时任务
     */
    stop() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        console.log('✓ 定时任务已停止');
    }
}
exports.ScheduledTasks = ScheduledTasks;
exports.scheduledTasks = new ScheduledTasks();
//# sourceMappingURL=scheduledTasks.js.map