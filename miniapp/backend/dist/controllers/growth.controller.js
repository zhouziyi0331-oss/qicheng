"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlockGraduationReport = exports.getGraduationReport = exports.generateGraduationReport = exports.updateMilestone = exports.getGrowthPathHistory = exports.getLatestGrowthPath = exports.generateGrowthPath = exports.getLatestComparisonReport = exports.getComparisonReports = exports.compareRadars = exports.getLatestAbilityRadar = exports.getAbilityRadarHistory = exports.getLatestAssessment = exports.getAssessments = exports.submitAssessment = void 0;
const assessment_service_1 = require("../services/assessment.service");
const abilityRadar_service_1 = require("../services/abilityRadar.service");
const comparisonReport_service_1 = require("../services/comparisonReport.service");
const dynamicGrowthPath_service_1 = require("../services/dynamicGrowthPath.service");
const graduationReport_service_1 = require("../services/graduationReport.service");
const payment_service_1 = require("../services/payment.service");
const logger_1 = require("../utils/logger");
/**
 * 个人成长控制器
 * 处理OC测评、能力雷达图、对比报告、成长路径、毕业报告
 */
/**
 * POST /api/growth/assessment
 * 提交测评并生成结果
 */
const submitAssessment = async (req, res) => {
    try {
        const userId = req.userId;
        const { answers } = req.body;
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ error: '测评答案格式不正确' });
        }
        const result = await assessment_service_1.assessmentService.generateAssessmentResult(userId, answers);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.log.error('提交测评失败', { error: error.message });
        res.status(500).json({ error: error.message || '提交测评失败' });
    }
};
exports.submitAssessment = submitAssessment;
/**
 * GET /api/growth/assessments
 * 获取测评历史
 */
const getAssessments = async (req, res) => {
    try {
        const userId = req.userId;
        const assessments = await assessment_service_1.assessmentService.getUserAssessments(userId);
        res.json({
            success: true,
            data: {
                total: assessments.length,
                assessments
            }
        });
    }
    catch (error) {
        logger_1.log.error('获取测评历史失败', { error: error.message });
        res.status(500).json({ error: '获取测评历史失败' });
    }
};
exports.getAssessments = getAssessments;
/**
 * GET /api/growth/assessment/latest
 * 获取最新测评
 */
const getLatestAssessment = async (req, res) => {
    try {
        const userId = req.userId;
        const assessment = await assessment_service_1.assessmentService.getLatestAssessment(userId);
        if (!assessment) {
            return res.status(404).json({ error: '未找到测评记录' });
        }
        res.json({
            success: true,
            data: assessment
        });
    }
    catch (error) {
        logger_1.log.error('获取最新测评失败', { error: error.message });
        res.status(500).json({ error: '获取最新测评失败' });
    }
};
exports.getLatestAssessment = getLatestAssessment;
/**
 * GET /api/growth/ability-radar
 * 获取能力雷达图历史
 */
const getAbilityRadarHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const radars = await abilityRadar_service_1.abilityRadarService.getUserRadarHistory(userId);
        res.json({
            success: true,
            data: {
                total: radars.length,
                radars
            }
        });
    }
    catch (error) {
        logger_1.log.error('获取雷达图历史失败', { error: error.message });
        res.status(500).json({ error: '获取雷达图历史失败' });
    }
};
exports.getAbilityRadarHistory = getAbilityRadarHistory;
/**
 * GET /api/growth/ability-radar/latest
 * 获取最新雷达图
 */
const getLatestAbilityRadar = async (req, res) => {
    try {
        const userId = req.userId;
        const radar = await abilityRadar_service_1.abilityRadarService.getLatestRadar(userId);
        if (!radar) {
            return res.status(404).json({ error: '未找到雷达图' });
        }
        res.json({
            success: true,
            data: radar
        });
    }
    catch (error) {
        logger_1.log.error('获取最新雷达图失败', { error: error.message });
        res.status(500).json({ error: '获取最新雷达图失败' });
    }
};
exports.getLatestAbilityRadar = getLatestAbilityRadar;
/**
 * GET /api/growth/ability-radar/compare
 * 对比两个雷达图
 */
const compareRadars = async (req, res) => {
    try {
        const userId = req.userId;
        const { snapshot1, snapshot2 } = req.query;
        if (!snapshot1 || !snapshot2) {
            return res.status(400).json({ error: '请提供两个快照编号' });
        }
        const comparison = await abilityRadar_service_1.abilityRadarService.compareRadars(userId, parseInt(snapshot1), parseInt(snapshot2));
        res.json({
            success: true,
            data: comparison
        });
    }
    catch (error) {
        logger_1.log.error('对比雷达图失败', { error: error.message });
        res.status(500).json({ error: error.message || '对比雷达图失败' });
    }
};
exports.compareRadars = compareRadars;
/**
 * GET /api/growth/comparison-reports
 * 获取对比报告历史
 */
const getComparisonReports = async (req, res) => {
    try {
        const userId = req.userId;
        const reports = await comparisonReport_service_1.comparisonReportService.getUserComparisonReports(userId);
        res.json({
            success: true,
            data: {
                total: reports.length,
                reports
            }
        });
    }
    catch (error) {
        logger_1.log.error('获取对比报告失败', { error: error.message });
        res.status(500).json({ error: '获取对比报告失败' });
    }
};
exports.getComparisonReports = getComparisonReports;
/**
 * GET /api/growth/comparison-reports/latest
 * 获取最新对比报告
 */
const getLatestComparisonReport = async (req, res) => {
    try {
        const userId = req.userId;
        const report = await comparisonReport_service_1.comparisonReportService.getLatestComparisonReport(userId);
        if (!report) {
            return res.status(404).json({ error: '未找到对比报告' });
        }
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        logger_1.log.error('获取最新对比报告失败', { error: error.message });
        res.status(500).json({ error: '获取最新对比报告失败' });
    }
};
exports.getLatestComparisonReport = getLatestComparisonReport;
/**
 * POST /api/growth/growth-path/generate
 * 生成/更新成长路径
 */
const generateGrowthPath = async (req, res) => {
    try {
        const userId = req.userId;
        const growthPath = await dynamicGrowthPath_service_1.dynamicGrowthPathService.generateGrowthPath(userId);
        res.json({
            success: true,
            data: growthPath
        });
    }
    catch (error) {
        logger_1.log.error('生成成长路径失败', { error: error.message });
        res.status(500).json({ error: error.message || '生成成长路径失败' });
    }
};
exports.generateGrowthPath = generateGrowthPath;
/**
 * GET /api/growth/growth-path/latest
 * 获取最新成长路径
 */
const getLatestGrowthPath = async (req, res) => {
    try {
        const userId = req.userId;
        const path = await dynamicGrowthPath_service_1.dynamicGrowthPathService.getLatestGrowthPath(userId);
        if (!path) {
            return res.status(404).json({ error: '未找到成长路径' });
        }
        res.json({
            success: true,
            data: path
        });
    }
    catch (error) {
        logger_1.log.error('获取成长路径失败', { error: error.message });
        res.status(500).json({ error: '获取成长路径失败' });
    }
};
exports.getLatestGrowthPath = getLatestGrowthPath;
/**
 * GET /api/growth/growth-path/history
 * 获取成长路径历史
 */
const getGrowthPathHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const paths = await dynamicGrowthPath_service_1.dynamicGrowthPathService.getGrowthPathHistory(userId);
        res.json({
            success: true,
            data: {
                total: paths.length,
                paths
            }
        });
    }
    catch (error) {
        logger_1.log.error('获取成长路径历史失败', { error: error.message });
        res.status(500).json({ error: '获取成长路径历史失败' });
    }
};
exports.getGrowthPathHistory = getGrowthPathHistory;
/**
 * POST /api/growth/growth-path/milestone
 * 更新里程碑状态
 */
const updateMilestone = async (req, res) => {
    try {
        const userId = req.userId;
        const { milestoneTitle, completed } = req.body;
        if (!milestoneTitle) {
            return res.status(400).json({ error: '请提供里程碑标题' });
        }
        const path = await dynamicGrowthPath_service_1.dynamicGrowthPathService.updateMilestone(userId, milestoneTitle, completed);
        res.json({
            success: true,
            data: path
        });
    }
    catch (error) {
        logger_1.log.error('更新里程碑失败', { error: error.message });
        res.status(500).json({ error: error.message || '更新里程碑失败' });
    }
};
exports.updateMilestone = updateMilestone;
/**
 * POST /api/growth/graduation-report/generate
 * 生成毕业报告
 */
const generateGraduationReport = async (req, res) => {
    try {
        const userId = req.userId;
        const result = await graduationReport_service_1.graduationReportService.generateGraduationReport(userId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.log.error('生成毕业报告失败', { error: error.message });
        res.status(500).json({ error: error.message || '生成毕业报告失败' });
    }
};
exports.generateGraduationReport = generateGraduationReport;
/**
 * GET /api/growth/graduation-report
 * 获取毕业报告
 */
const getGraduationReport = async (req, res) => {
    try {
        const userId = req.userId;
        const report = await graduationReport_service_1.graduationReportService.getGraduationReport(userId);
        if (!report) {
            return res.status(404).json({ error: '未找到毕业报告' });
        }
        // 如果未解锁，只返回部分信息
        if (!report.isUnlocked) {
            return res.json({
                success: true,
                data: {
                    reportId: report._id,
                    status: report.status,
                    isUnlocked: false,
                    preview: {
                        journeySummary: report.journeySummary,
                        projectAchievements: report.projectAchievements,
                        abilityGrowth: {
                            initialLevel: report.abilityGrowth?.initialLevel,
                            finalLevel: report.abilityGrowth?.finalLevel,
                            levelUpCount: report.abilityGrowth?.levelUpCount
                        }
                    },
                    message: '完整报告需要解锁'
                }
            });
        }
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        logger_1.log.error('获取毕业报告失败', { error: error.message });
        res.status(500).json({ error: '获取毕业报告失败' });
    }
};
exports.getGraduationReport = getGraduationReport;
/**
 * POST /api/growth/graduation-report/unlock
 * 解锁毕业报告
 */
const unlockGraduationReport = async (req, res) => {
    try {
        const userId = req.userId;
        // 验证支付
        const report = await graduationReport_service_1.graduationReportService.getGraduationReport(userId);
        if (!report) {
            return res.status(404).json({ error: '毕业报告不存在' });
        }
        const hasPaid = await payment_service_1.paymentService.verifyPayment(userId, 'graduation_report', report._id.toString());
        if (!hasPaid) {
            return res.status(403).json({ error: '请先完成支付' });
        }
        const unlockedReport = await graduationReport_service_1.graduationReportService.unlockGraduationReport(userId);
        res.json({
            success: true,
            data: unlockedReport
        });
    }
    catch (error) {
        logger_1.log.error('解锁毕业报告失败', { error: error.message });
        res.status(500).json({ error: error.message || '解锁毕业报告失败' });
    }
};
exports.unlockGraduationReport = unlockGraduationReport;
//# sourceMappingURL=growth.controller.js.map