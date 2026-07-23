"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backgroundTaskService = exports.BackgroundTaskService = void 0;
const BackgroundTask_1 = require("../models/BackgroundTask");
const abilityRadar_service_1 = require("./abilityRadar.service");
const comparisonReport_service_1 = require("./comparisonReport.service");
const dynamicGrowthPath_service_1 = require("./dynamicGrowthPath.service");
const graduationReport_service_1 = require("./graduationReport.service");
const achievement_service_1 = require("./achievement.service");
const logger_1 = require("../utils/logger");
/**
 * 后台任务服务
 * 管理异步任务的创建、执行、重试和状态追踪
 */
class BackgroundTaskService {
    /**
     * 创建后台任务
     */
    async createTask(data) {
        const task = await BackgroundTask_1.BackgroundTask.create({
            userId: data.userId,
            taskType: data.taskType,
            taskName: data.taskName,
            relatedId: data.relatedId,
            metadata: data.metadata,
            status: 'pending',
            attempts: 0,
            maxAttempts: data.maxAttempts || 3
        });
        logger_1.log.info('后台任务已创建', {
            taskId: task._id,
            taskType: data.taskType,
            userId: data.userId
        });
        // 立即尝试执行
        setImmediate(() => this.executeTask(task._id.toString()));
        return task;
    }
    /**
     * 执行后台任务
     */
    async executeTask(taskId) {
        const task = await BackgroundTask_1.BackgroundTask.findById(taskId);
        if (!task) {
            logger_1.log.error('任务不存在', { taskId });
            return;
        }
        // 检查是否超过最大尝试次数
        if (task.attempts >= task.maxAttempts) {
            task.status = 'failed';
            task.error = '超过最大重试次数';
            await task.save();
            logger_1.log.error('任务失败：超过最大重试次数', { taskId, attempts: task.attempts });
            return;
        }
        // 更新任务状态
        task.status = 'processing';
        task.attempts += 1;
        task.lastAttemptAt = new Date();
        await task.save();
        logger_1.log.info('开始执行后台任务', {
            taskId,
            taskType: task.taskType,
            attempt: task.attempts,
            maxAttempts: task.maxAttempts
        });
        try {
            let result;
            // 根据任务类型执行不同的逻辑
            switch (task.taskType) {
                case 'ability_radar':
                    result = await abilityRadar_service_1.abilityRadarService.generateAfterProjectCompletion(task.userId.toString(), task.relatedId);
                    break;
                case 'comparison_report':
                    result = await comparisonReport_service_1.comparisonReportService.generateComparisonReport(task.userId.toString(), task.relatedId);
                    break;
                case 'growth_path':
                    result = await dynamicGrowthPath_service_1.dynamicGrowthPathService.generateGrowthPath(task.userId.toString());
                    break;
                case 'graduation_report':
                    result = await graduationReport_service_1.graduationReportService.generateGraduationReport(task.userId.toString());
                    break;
                case 'achievement_check':
                    result = await achievement_service_1.achievementService.checkAllAchievements(task.userId.toString());
                    break;
                default:
                    throw new Error(`未知的任务类型: ${task.taskType}`);
            }
            // 任务成功
            task.status = 'completed';
            task.completedAt = new Date();
            task.result = result;
            task.error = undefined;
            task.errorStack = undefined;
            await task.save();
            logger_1.log.info('后台任务执行成功', {
                taskId,
                taskType: task.taskType,
                userId: task.userId
            });
        }
        catch (error) {
            logger_1.log.error('后台任务执行失败', {
                taskId,
                taskType: task.taskType,
                attempt: task.attempts,
                error: error.message
            });
            task.error = error.message;
            task.errorStack = error.stack;
            // 如果还有重试机会，将任务状态设为pending，稍后重试
            if (task.attempts < task.maxAttempts) {
                task.status = 'pending';
                await task.save();
                // 延迟重试（指数退避）
                const retryDelay = Math.min(1000 * Math.pow(2, task.attempts - 1), 30000); // 最多30秒
                setTimeout(() => {
                    this.executeTask(taskId);
                }, retryDelay);
                logger_1.log.info('任务将在稍后重试', {
                    taskId,
                    retryDelay,
                    nextAttempt: task.attempts + 1
                });
            }
            else {
                // 达到最大重试次数，标记为失败
                task.status = 'failed';
                await task.save();
                logger_1.log.error('任务最终失败', {
                    taskId,
                    taskType: task.taskType,
                    attempts: task.attempts
                });
            }
        }
    }
    /**
     * 获取用户的任务列表
     */
    async getUserTasks(userId, options) {
        const filter = { userId };
        if (options?.status)
            filter.status = options.status;
        if (options?.taskType)
            filter.taskType = options.taskType;
        const tasks = await BackgroundTask_1.BackgroundTask.find(filter)
            .sort({ createdAt: -1 })
            .limit(options?.limit || 20)
            .skip(options?.skip || 0);
        return tasks;
    }
    /**
     * 获取任务详情
     */
    async getTaskById(taskId) {
        return await BackgroundTask_1.BackgroundTask.findById(taskId);
    }
    /**
     * 重试失败的任务
     */
    async retryTask(taskId) {
        const task = await BackgroundTask_1.BackgroundTask.findById(taskId);
        if (!task) {
            throw new Error('任务不存在');
        }
        if (task.status !== 'failed') {
            throw new Error('只能重试失败的任务');
        }
        // 重置任务状态
        task.status = 'pending';
        task.attempts = 0;
        task.error = undefined;
        task.errorStack = undefined;
        await task.save();
        // 立即执行
        setImmediate(() => this.executeTask(taskId));
        return task;
    }
    /**
     * 获取任务统计
     */
    async getTaskStats(userId) {
        const filter = {};
        if (userId)
            filter.userId = userId;
        const [stats] = await BackgroundTask_1.BackgroundTask.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        const result = {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0
        };
        if (stats) {
            const grouped = await BackgroundTask_1.BackgroundTask.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);
            grouped.forEach((item) => {
                result[item._id] = item.count;
            });
        }
        return result;
    }
    /**
     * 清理旧任务（保留最近7天）
     */
    async cleanupOldTasks() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const result = await BackgroundTask_1.BackgroundTask.deleteMany({
            status: { $in: ['completed', 'failed'] },
            createdAt: { $lt: sevenDaysAgo }
        });
        logger_1.log.info('清理旧任务完成', { deletedCount: result.deletedCount });
        return result.deletedCount;
    }
}
exports.BackgroundTaskService = BackgroundTaskService;
exports.backgroundTaskService = new BackgroundTaskService();
//# sourceMappingURL=backgroundTask.service.js.map