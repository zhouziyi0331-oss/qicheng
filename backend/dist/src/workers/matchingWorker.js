"use strict";
/**
 * 匹配处理Worker
 * 异步处理学生-任务匹配计算
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMatchingWorker = startMatchingWorker;
const queue_1 = require("../config/queue");
const logger_1 = __importDefault(require("../utils/logger"));
const crossPlatformService_1 = __importDefault(require("../services/crossPlatformService"));
const queue_2 = require("../config/queue");
// ============================================================================
// 处理器注册
// ============================================================================
/**
 * 处理需求变更后的匹配重算
 * 并发数：5个
 */
queue_1.matchingQueue.process('recalculate-matches', 5, async (job) => {
    const { task_id, student_ids, new_requirements } = job.data;
    logger_1.default.info(`🔄 Recalculating matches for task ${task_id}, ${student_ids.length} students`);
    const results = [];
    let completed = 0;
    // 并行处理学生匹配
    for (const studentId of student_ids) {
        try {
            // 重新计算匹配分数
            const newScore = await crossPlatformService_1.default.recalculateMatchScore(studentId, task_id, new_requirements);
            results.push({
                student_id: studentId,
                new_score: newScore,
                status: 'success'
            });
            completed++;
            // 更新进度
            job.progress((completed / student_ids.length) * 100);
            // 如果分数变化，推送通知任务到通知队列
            await queue_2.notificationQueue.add('matching-score-changed', {
                student_id: studentId,
                task_id: task_id,
                new_score: newScore,
            });
        }
        catch (error) {
            logger_1.default.error(`Failed to recalculate for student ${studentId}:`, error);
            results.push({
                student_id: studentId,
                status: 'failed',
                error: error.message
            });
        }
    }
    logger_1.default.info(`✅ Recalculation completed: ${completed}/${student_ids.length} succeeded`);
    return {
        completed,
        total: student_ids.length,
        results,
    };
});
/**
 * 处理学生等级变化
 * 并发数：3个
 */
queue_1.matchingQueue.process('student-level-changed', 3, async (job) => {
    const { student_id, old_level, new_level } = job.data;
    logger_1.default.info(`🔄 Processing level change for student ${student_id}: ${old_level} → ${new_level}`);
    try {
        const result = await crossPlatformService_1.default.handleLevelChange(student_id, old_level, new_level);
        logger_1.default.info(`✅ Level change processed:`, result);
        return result;
    }
    catch (error) {
        logger_1.default.error(`Failed to process level change:`, error);
        throw error;
    }
});
// ============================================================================
// Worker启动
// ============================================================================
function startMatchingWorker() {
    logger_1.default.info('🚀 Matching worker started');
    logger_1.default.info('  - recalculate-matches: concurrency 5');
    logger_1.default.info('  - student-level-changed: concurrency 3');
    // 监听队列事件
    queue_1.matchingQueue.on('completed', (job, result) => {
        logger_1.default.info(`✅ [Matching] ${job.name} completed:`, {
            jobId: job.id,
            duration: `${Date.now() - job.timestamp}ms`,
        });
    });
    queue_1.matchingQueue.on('failed', (job, err) => {
        logger_1.default.error(`❌ [Matching] ${job?.name} failed:`, {
            jobId: job?.id,
            error: err.message,
        });
    });
}
exports.default = {
    startMatchingWorker,
};
//# sourceMappingURL=matchingWorker.js.map