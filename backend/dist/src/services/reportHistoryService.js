"use strict";
/**
 * Phase R5.4: 报告历史增强服务
 * 报告历史对比、数据可视化、版本管理
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportHistoryService = void 0;
const db_1 = require("../utils/db");
const logger_1 = __importDefault(require("../utils/logger"));
class ReportHistoryService {
    /**
     * 获取学生的报告历史
     */
    async getReportHistory(studentId, options = {}) {
        try {
            const { reportType, limit = 10, offset = 0 } = options;
            // 构建查询条件
            let whereClause = 'WHERE student_id = $1';
            const params = [studentId];
            if (reportType) {
                whereClause += ' AND report_type = $2';
                params.push(reportType);
            }
            // 获取总数
            const countResult = await (0, db_1.queryOne)(`SELECT COUNT(*) as count FROM student_reports ${whereClause}`, params);
            const total = parseInt(countResult?.count || '0');
            // 获取报告列表
            const reports = await (0, db_1.query)(`SELECT
          id,
          student_id,
          report_type,
          report_data,
          generated_at,
          generated_for_company_id
         FROM student_reports
         ${whereClause}
         ORDER BY generated_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
            logger_1.default.info('[报告历史] 查询报告历史', {
                studentId,
                reportType,
                total,
                returned: reports.rows.length
            });
            return {
                reports: reports.rows,
                total
            };
        }
        catch (error) {
            logger_1.default.error('[报告历史] 查询失败', { error, studentId });
            throw error;
        }
    }
    /**
     * 对比两个报告
     */
    async compareReports(studentId, olderReportId, newerReportId) {
        try {
            logger_1.default.info('[报告对比] 开始对比报告', {
                studentId,
                olderReportId,
                newerReportId
            });
            // 获取两个报告
            const olderReport = await (0, db_1.queryOne)(`SELECT * FROM student_reports
         WHERE id = $1 AND student_id = $2`, [olderReportId, studentId]);
            const newerReport = await (0, db_1.queryOne)(`SELECT * FROM student_reports
         WHERE id = $1 AND student_id = $2`, [newerReportId, studentId]);
            if (!olderReport || !newerReport) {
                throw new Error('报告不存在');
            }
            // 确保时间顺序正确
            if (new Date(olderReport.generated_at) > new Date(newerReport.generated_at)) {
                throw new Error('报告时间顺序错误');
            }
            // 对比分析
            const changes = this.analyzeChanges(olderReport.report_data, newerReport.report_data);
            // 生成总结
            const summary = this.generateComparisonSummary(changes);
            logger_1.default.info('[报告对比] 对比完成', {
                studentId,
                changes
            });
            return {
                studentId,
                olderReport: {
                    id: olderReport.id,
                    generatedAt: olderReport.generated_at,
                    data: olderReport.report_data
                },
                newerReport: {
                    id: newerReport.id,
                    generatedAt: newerReport.generated_at,
                    data: newerReport.report_data
                },
                changes,
                summary
            };
        }
        catch (error) {
            logger_1.default.error('[报告对比] 对比失败', { error, studentId });
            throw error;
        }
    }
    /**
     * 分析报告变化
     */
    analyzeChanges(olderData, newerData) {
        const changes = {
            skillImprovements: [],
            newMilestones: 0,
            taskCountIncrease: 0,
            qualityChange: 0
        };
        // 对比任务数量
        const oldTaskCount = olderData.summary?.totalTasks || 0;
        const newTaskCount = newerData.summary?.totalTasks || 0;
        changes.taskCountIncrease = newTaskCount - oldTaskCount;
        // 对比质量分
        const oldQuality = olderData.summary?.averageQuality || 0;
        const newQuality = newerData.summary?.averageQuality || 0;
        changes.qualityChange = parseFloat((newQuality - oldQuality).toFixed(2));
        // 对比里程碑
        const oldMilestones = olderData.milestones?.length || 0;
        const newMilestones = newerData.milestones?.length || 0;
        changes.newMilestones = newMilestones - oldMilestones;
        // 对比技能
        const oldStrengths = olderData.skillProfile?.strengths || [];
        const newStrengths = newerData.skillProfile?.strengths || [];
        // 找出新增的技能
        const addedSkills = newStrengths.filter((skill) => !oldStrengths.includes(skill));
        addedSkills.forEach((skill) => {
            changes.skillImprovements.push({
                skill,
                oldLevel: '未掌握',
                newLevel: '已掌握',
                improvement: 'new'
            });
        });
        // 对比成长趋势
        if (olderData.summary?.growthTrend !== newerData.summary?.growthTrend) {
            changes.growthTrendChange = `从 ${olderData.summary?.growthTrend} 变为 ${newerData.summary?.growthTrend}`;
        }
        return changes;
    }
    /**
     * 生成对比总结
     */
    generateComparisonSummary(changes) {
        const parts = [];
        if (changes.taskCountIncrease > 0) {
            parts.push(`完成了 ${changes.taskCountIncrease} 个新任务`);
        }
        if (changes.newMilestones > 0) {
            parts.push(`达成了 ${changes.newMilestones} 个新里程碑`);
        }
        if (changes.qualityChange > 0) {
            parts.push(`作品质量提升了 ${changes.qualityChange.toFixed(1)} 分`);
        }
        else if (changes.qualityChange < 0) {
            parts.push(`作品质量下降了 ${Math.abs(changes.qualityChange).toFixed(1)} 分`);
        }
        if (changes.skillImprovements.length > 0) {
            parts.push(`掌握了 ${changes.skillImprovements.length} 项新技能`);
        }
        if (parts.length === 0) {
            return '两个报告期间没有明显变化';
        }
        return '在这段时间里，你' + parts.join('，') + '。';
    }
    /**
     * 获取成长曲线数据
     */
    async getGrowthCurve(studentId, timeRange = 90) {
        try {
            logger_1.default.info('[成长曲线] 生成成长曲线数据', { studentId, timeRange });
            // 获取历史报告（按时间排序）
            const reports = await (0, db_1.query)(`SELECT
          report_data,
          generated_at
         FROM student_reports
         WHERE student_id = $1
           AND generated_at > NOW() - INTERVAL '${timeRange} days'
         ORDER BY generated_at ASC`, [studentId]);
            // 构建数据点
            const dataPoints = reports.rows.map((report) => ({
                date: report.generated_at.toISOString().split('T')[0],
                tasksCompleted: report.report_data.summary?.totalTasks || 0,
                averageQuality: report.report_data.summary?.averageQuality || 0,
                confidenceScore: report.report_data.summary?.confidenceScore || 0,
                level: report.report_data.summary?.level || 1
            }));
            // 计算趋势
            const trends = this.calculateTrends(dataPoints);
            logger_1.default.info('[成长曲线] 生成完成', {
                studentId,
                dataPoints: dataPoints.length
            });
            return {
                studentId,
                timeRange,
                dataPoints,
                trends
            };
        }
        catch (error) {
            logger_1.default.error('[成长曲线] 生成失败', { error, studentId });
            throw error;
        }
    }
    /**
     * 计算趋势
     */
    calculateTrends(dataPoints) {
        if (dataPoints.length < 2) {
            return {
                taskCompletionTrend: 'stable',
                qualityTrend: 'stable',
                overallGrowth: 0
            };
        }
        const first = dataPoints[0];
        const last = dataPoints[dataPoints.length - 1];
        // 任务完成趋势
        const taskIncrease = last.tasksCompleted - first.tasksCompleted;
        const taskCompletionTrend = taskIncrease > 5 ? 'increasing' :
            taskIncrease < -5 ? 'decreasing' : 'stable';
        // 质量趋势
        const qualityChange = last.averageQuality - first.averageQuality;
        const qualityTrend = qualityChange > 5 ? 'improving' :
            qualityChange < -5 ? 'declining' : 'stable';
        // 整体成长（综合任务数和质量）
        const overallGrowth = ((taskIncrease / (first.tasksCompleted || 1)) * 0.5 +
            (qualityChange / (first.averageQuality || 1)) * 0.5) * 100;
        return {
            taskCompletionTrend,
            qualityTrend,
            overallGrowth: parseFloat(overallGrowth.toFixed(1))
        };
    }
    /**
     * 获取技能雷达图数据
     */
    async getSkillRadarData(studentId) {
        try {
            logger_1.default.info('[技能雷达] 获取技能雷达数据', { studentId });
            // 获取最新报告
            const latestReport = await (0, db_1.queryOne)(`SELECT report_data FROM student_reports
         WHERE student_id = $1
         ORDER BY generated_at DESC
         LIMIT 1`, [studentId]);
            if (!latestReport) {
                return null;
            }
            // 提取技能数据（从OPC画像或报告中）
            const skillProfile = latestReport.report_data.skillProfile || {};
            const strengths = skillProfile.strengths || [];
            const weaknesses = skillProfile.weaknesses || [];
            // 构建雷达图数据
            const radarData = {
                dimensions: [
                    '信息加工',
                    '创造驱动',
                    '工具学习',
                    '任务执行',
                    '协同配合',
                    '风险偏好'
                ],
                scores: [
                    this.calculateDimensionScore('info_processing', strengths, weaknesses),
                    this.calculateDimensionScore('creation_drive', strengths, weaknesses),
                    this.calculateDimensionScore('tool_learning', strengths, weaknesses),
                    this.calculateDimensionScore('task_execution', strengths, weaknesses),
                    this.calculateDimensionScore('collaboration', strengths, weaknesses),
                    this.calculateDimensionScore('risk_attitude', strengths, weaknesses)
                ]
            };
            return radarData;
        }
        catch (error) {
            logger_1.default.error('[技能雷达] 获取失败', { error, studentId });
            throw error;
        }
    }
    /**
     * 计算维度得分
     */
    calculateDimensionScore(dimension, strengths, weaknesses) {
        // 简化版：基于strengths和weaknesses计算得分
        // 实际应该从OPC测评结果或更详细的数据中获取
        const baseScore = 50;
        const strengthBonus = strengths.filter((s) => s.toLowerCase().includes(dimension.split('_')[0])).length * 10;
        const weaknessPenalty = weaknesses.filter((w) => w.toLowerCase().includes(dimension.split('_')[0])).length * 10;
        return Math.min(100, Math.max(0, baseScore + strengthBonus - weaknessPenalty));
    }
    /**
     * 获取里程碑时间轴
     */
    async getMilestoneTimeline(studentId) {
        try {
            logger_1.default.info('[里程碑时间轴] 获取时间轴数据', { studentId });
            // 从所有报告中提取里程碑
            const reports = await (0, db_1.query)(`SELECT report_data, generated_at FROM student_reports
         WHERE student_id = $1
         ORDER BY generated_at ASC`, [studentId]);
            const allMilestones = [];
            reports.rows.forEach((report) => {
                const milestones = report.report_data.milestones || [];
                milestones.forEach((milestone) => {
                    allMilestones.push({
                        ...milestone,
                        reportDate: report.generated_at
                    });
                });
            });
            // 去重并按时间排序
            const uniqueMilestones = this.deduplicateMilestones(allMilestones);
            logger_1.default.info('[里程碑时间轴] 获取完成', {
                studentId,
                count: uniqueMilestones.length
            });
            return uniqueMilestones;
        }
        catch (error) {
            logger_1.default.error('[里程碑时间轴] 获取失败', { error, studentId });
            throw error;
        }
    }
    /**
     * 去重里程碑
     */
    deduplicateMilestones(milestones) {
        const seen = new Set();
        return milestones.filter(m => {
            const key = `${m.type}-${m.description}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
}
exports.reportHistoryService = new ReportHistoryService();
exports.default = exports.reportHistoryService;
//# sourceMappingURL=reportHistoryService.js.map