"use strict";
/**
 * Phase R5.3: 报告自动触发服务
 * 在关键时刻自动生成学生能力报告
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportTriggerService = exports.ReportTrigger = void 0;
const queue_1 = require("../config/queue");
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
var ReportTrigger;
(function (ReportTrigger) {
    ReportTrigger["LEVEL_UPGRADE"] = "level_upgrade";
    ReportTrigger["TASK_MILESTONE"] = "task_milestone";
    ReportTrigger["PERIODIC_WEEKLY"] = "periodic_weekly";
    ReportTrigger["PERIODIC_MONTHLY"] = "periodic_monthly";
    ReportTrigger["MANUAL_REQUEST"] = "manual_request";
    ReportTrigger["PURCHASE_REQUEST"] = "purchase_request"; // 企业购买触发
})(ReportTrigger || (exports.ReportTrigger = ReportTrigger = {}));
class ReportTriggerService {
    /**
     * 学生升级时触发报告生成
     */
    async onLevelUpgrade(studentId, oldLevel, newLevel) {
        try {
            logger_1.default.info('[报告触发] 学生升级，触发报告生成', { studentId, oldLevel, newLevel });
            // 检查是否需要生成报告（避免频繁生成）
            const shouldGenerate = await this.shouldGenerateOnLevelUp(studentId, newLevel);
            if (!shouldGenerate) {
                logger_1.default.info('[报告触发] 跳过报告生成（频率限制）', { studentId, newLevel });
                return;
            }
            // 添加到队列（高优先级）
            await this.enqueueReportGeneration({
                studentId,
                trigger: ReportTrigger.LEVEL_UPGRADE,
                triggerContext: {
                    oldLevel,
                    newLevel
                },
                reportType: 'comprehensive',
                priority: 1 // 高优先级
            });
            logger_1.default.info('[报告触发] 升级报告已加入队列', { studentId, newLevel });
        }
        catch (error) {
            logger_1.default.error('[报告触发] 升级报告触发失败', { error, studentId });
        }
    }
    /**
     * 任务完成时触发报告生成（里程碑任务）
     */
    async onTaskCompleted(studentId, taskId) {
        try {
            // 获取学生完成的任务总数
            const taskCount = await this.getCompletedTaskCount(studentId);
            // 检查是否是里程碑任务（第5、10、20、30、50、100...个任务）
            const isMilestone = this.isMilestoneTask(taskCount);
            if (!isMilestone) {
                return;
            }
            logger_1.default.info('[报告触发] 里程碑任务完成，触发报告生成', { studentId, taskId, taskCount });
            // 检查频率限制
            const shouldGenerate = await this.shouldGenerateOnTaskMilestone(studentId);
            if (!shouldGenerate) {
                logger_1.default.info('[报告触发] 跳过报告生成（频率限制）', { studentId, taskCount });
                return;
            }
            // 添加到队列（中优先级）
            await this.enqueueReportGeneration({
                studentId,
                trigger: ReportTrigger.TASK_MILESTONE,
                triggerContext: {
                    taskId,
                    taskCount
                },
                reportType: 'growth',
                priority: 2 // 中优先级
            });
            logger_1.default.info('[报告触发] 里程碑报告已加入队列', { studentId, taskCount });
        }
        catch (error) {
            logger_1.default.error('[报告触发] 任务完成报告触发失败', { error, studentId, taskId });
        }
    }
    /**
     * 企业购买报告时触发生成
     */
    async onReportPurchase(studentId, companyId) {
        try {
            logger_1.default.info('[报告触发] 企业购买报告，触发生成', { studentId, companyId });
            // 添加到队列（最高优先级，企业付费了）
            await this.enqueueReportGeneration({
                studentId,
                trigger: ReportTrigger.PURCHASE_REQUEST,
                triggerContext: {
                    requestedBy: companyId
                },
                reportType: 'comprehensive',
                priority: 0 // 最高优先级
            });
            logger_1.default.info('[报告触发] 购买报告已加入队列', { studentId, companyId });
        }
        catch (error) {
            logger_1.default.error('[报告触发] 购买报告触发失败', { error, studentId, companyId });
        }
    }
    /**
     * 手动触发报告生成
     */
    async onManualRequest(studentId, reportType = 'comprehensive') {
        try {
            logger_1.default.info('[报告触发] 手动请求报告生成', { studentId, reportType });
            await this.enqueueReportGeneration({
                studentId,
                trigger: ReportTrigger.MANUAL_REQUEST,
                reportType,
                priority: 1
            });
            logger_1.default.info('[报告触发] 手动报告已加入队列', { studentId, reportType });
        }
        catch (error) {
            logger_1.default.error('[报告触发] 手动报告触发失败', { error, studentId });
        }
    }
    /**
     * 将报告生成任务加入队列
     */
    async enqueueReportGeneration(jobData) {
        await queue_1.reportQueue.add('generate-report', jobData, {
            priority: jobData.priority || 3,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000
            }
        });
    }
    /**
     * 判断升级时是否应该生成报告（频率限制）
     */
    async shouldGenerateOnLevelUp(studentId, newLevel) {
        // 每次升级都生成报告
        return true;
    }
    /**
     * 判断任务里程碑时是否应该生成报告（频率限制）
     */
    async shouldGenerateOnTaskMilestone(studentId) {
        // 检查最近一次报告生成时间
        const lastReport = await (0, db_1.queryOne)(`SELECT generated_at FROM student_reports
       WHERE student_id = $1
       ORDER BY generated_at DESC
       LIMIT 1`, [studentId]);
        if (!lastReport) {
            return true;
        }
        // 至少间隔7天
        const daysSinceLastReport = (Date.now() - new Date(lastReport.generated_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastReport >= 7;
    }
    /**
     * 获取学生完成的任务总数
     */
    async getCompletedTaskCount(studentId) {
        const result = await (0, db_1.queryOne)(`SELECT COUNT(*) as count FROM tasks
       WHERE student_id = $1 AND status = 'completed'`, [studentId]);
        return parseInt(result?.count || '0');
    }
    /**
     * 判断是否是里程碑任务
     */
    isMilestoneTask(taskCount) {
        // 第5、10、20、30、50、100、200、500个任务是里程碑
        const milestones = [5, 10, 20, 30, 50, 100, 200, 500];
        return milestones.includes(taskCount);
    }
    /**
     * 定期报告生成 - 每周
     */
    async generateWeeklyReports() {
        try {
            logger_1.default.info('[报告触发] 开始每周定期报告生成');
            // 查找需要生成周报的学生（活跃用户）
            const activeStudents = await (0, db_1.query)(`SELECT DISTINCT u.id
         FROM users u
         WHERE u.role = 'student'
           AND u.report_public = true  -- 只为公开报告的学生生成
           AND EXISTS (
             SELECT 1 FROM tasks t
             WHERE t.student_id = u.id
               AND t.updated_at > NOW() - INTERVAL '7 days'
           )
         LIMIT 100`, // 限制每次最多100个
            []);
            logger_1.default.info('[报告触发] 找到活跃学生', { count: activeStudents.rows.length });
            // 批量加入队列
            for (const student of activeStudents.rows) {
                await this.enqueueReportGeneration({
                    studentId: student.id,
                    trigger: ReportTrigger.PERIODIC_WEEKLY,
                    reportType: 'summary',
                    priority: 5 // 低优先级
                });
            }
            logger_1.default.info('[报告触发] 每周报告已全部加入队列', { count: activeStudents.rows.length });
        }
        catch (error) {
            logger_1.default.error('[报告触发] 每周报告生成失败', { error });
        }
    }
    /**
     * 定期报告生成 - 每月
     */
    async generateMonthlyReports() {
        try {
            logger_1.default.info('[报告触发] 开始每月定期报告生成');
            // 查找需要生成月报的学生（所有有任务的学生）
            const students = await (0, db_1.query)(`SELECT DISTINCT u.id
         FROM users u
         WHERE u.role = 'student'
           AND EXISTS (
             SELECT 1 FROM tasks t
             WHERE t.student_id = u.id
               AND t.status = 'completed'
           )
         LIMIT 500`, // 每月最多500个
            []);
            logger_1.default.info('[报告触发] 找到有任务的学生', { count: students.rows.length });
            // 批量加入队列
            for (const student of students.rows) {
                await this.enqueueReportGeneration({
                    studentId: student.id,
                    trigger: ReportTrigger.PERIODIC_MONTHLY,
                    reportType: 'comprehensive',
                    priority: 4 // 低优先级
                });
            }
            logger_1.default.info('[报告触发] 每月报告已全部加入队列', { count: students.rows.length });
        }
        catch (error) {
            logger_1.default.error('[报告触发] 每月报告生成失败', { error });
        }
    }
    /**
     * 获取报告生成统计
     */
    async getGenerationStats(studentId) {
        try {
            let whereClause = '';
            let params = [];
            if (studentId) {
                whereClause = 'WHERE student_id = $1';
                params = [studentId];
            }
            const stats = await (0, db_1.query)(`SELECT
          COUNT(*) as total_reports,
          COUNT(*) FILTER (WHERE generated_at > NOW() - INTERVAL '7 days') as reports_last_7d,
          COUNT(*) FILTER (WHERE generated_at > NOW() - INTERVAL '30 days') as reports_last_30d,
          MAX(generated_at) as last_generated_at
         FROM student_reports
         ${whereClause}`, params);
            return stats.rows[0] || {
                total_reports: 0,
                reports_last_7d: 0,
                reports_last_30d: 0,
                last_generated_at: null
            };
        }
        catch (error) {
            logger_1.default.error('[报告触发] 获取统计失败', { error, studentId });
            return null;
        }
    }
}
exports.reportTriggerService = new ReportTriggerService();
exports.default = exports.reportTriggerService;
//# sourceMappingURL=reportTriggerService.js.map