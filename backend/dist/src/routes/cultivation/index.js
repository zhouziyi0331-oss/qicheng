"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cultivationService_1 = __importDefault(require("../../services/cultivationService"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
/**
 * E-12: 定向培养计划路由
 */
// 创建培养计划
router.post('/plans', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.userId;
        const plan = await cultivationService_1.default.createPlan({
            company_id: companyId,
            ...req.body,
        });
        res.json({
            success: true,
            data: plan,
            message: '培养计划创建成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '创建培养计划失败',
        });
    }
});
// 学生响应培养计划
router.post('/plans/:id/respond', auth_1.authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.userId;
        const { id } = req.params;
        const { accepted, response } = req.body;
        const plan = await cultivationService_1.default.respondToPlan(id, studentId, accepted, response);
        res.json({
            success: true,
            data: plan,
            message: accepted ? '已接受培养计划' : '已拒绝培养计划',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '响应培养计划失败',
        });
    }
});
// 获取企业的培养计划列表
router.get('/plans/company', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.userId;
        const { status } = req.query;
        const plans = await cultivationService_1.default.getCompanyPlans(companyId, status);
        res.json({
            success: true,
            data: plans,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取培养计划列表失败',
        });
    }
});
// 获取学生的培养计划列表
router.get('/plans/student', auth_1.authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.userId;
        const { status } = req.query;
        const plans = await cultivationService_1.default.getStudentPlans(studentId, status);
        res.json({
            success: true,
            data: plans,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取培养计划列表失败',
        });
    }
});
// 获取培养计划详情
router.get('/plans/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await cultivationService_1.default.getPlanById(id);
        res.json({
            success: true,
            data: plan,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取培养计划详情失败',
        });
    }
});
// 更新培养计划
router.put('/plans/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await cultivationService_1.default.updatePlan(id, req.body);
        res.json({
            success: true,
            data: plan,
            message: '培养计划更新成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '更新培养计划失败',
        });
    }
});
// 关联任务到培养计划
router.post('/plans/:id/link-task', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { task_id, phase_number, purpose } = req.body;
        if (!task_id || !phase_number) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数',
            });
        }
        await cultivationService_1.default.linkTask(id, task_id, phase_number, purpose);
        res.json({
            success: true,
            message: '任务关联成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '关联任务失败',
        });
    }
});
// 记录技能学习
router.post('/plans/:id/skills/start', auth_1.authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.userId;
        const { id } = req.params;
        const { skill_name, skill_category } = req.body;
        if (!skill_name) {
            return res.status(400).json({
                success: false,
                message: '请提供技能名称',
            });
        }
        const record = await cultivationService_1.default.recordSkillLearning(id, studentId, skill_name, skill_category);
        res.json({
            success: true,
            data: record,
            message: '技能学习记录已创建',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '记录技能学习失败',
        });
    }
});
// 完成技能学习
router.post('/skills/:recordId/complete', auth_1.authenticateToken, async (req, res) => {
    try {
        const { recordId } = req.params;
        const { proficiency_level, verified_by_task_id } = req.body;
        if (!proficiency_level) {
            return res.status(400).json({
                success: false,
                message: '请提供熟练度评分',
            });
        }
        const record = await cultivationService_1.default.completeSkillLearning(recordId, proficiency_level, verified_by_task_id);
        res.json({
            success: true,
            data: record,
            message: '技能学习已完成',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '完成技能学习失败',
        });
    }
});
// 添加反馈
router.post('/plans/:id/feedback', auth_1.authenticateToken, async (req, res) => {
    try {
        const feedbackBy = req.user.userId;
        const { id } = req.params;
        const { feedback_role, feedback_type, content } = req.body;
        if (!feedback_type || !content) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数',
            });
        }
        const feedback = await cultivationService_1.default.addFeedback(id, feedbackBy, feedback_role, feedback_type, content);
        res.json({
            success: true,
            data: feedback,
            message: '反馈添加成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '添加反馈失败',
        });
    }
});
// 获取反馈列表
router.get('/plans/:id/feedback', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const feedbacks = await cultivationService_1.default.getFeedbacks(id);
        res.json({
            success: true,
            data: feedbacks,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取反馈列表失败',
        });
    }
});
// 评估培养计划
router.post('/plans/:id/evaluate', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { evaluation, success_score } = req.body;
        if (!evaluation || success_score === undefined) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数',
            });
        }
        const plan = await cultivationService_1.default.evaluatePlan(id, evaluation, success_score);
        res.json({
            success: true,
            data: plan,
            message: '培养计划评估完成',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '评估培养计划失败',
        });
    }
});
// 获取培养统计
router.get('/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.userId;
        const stats = await cultivationService_1.default.getCultivationStats(companyId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取培养统计失败',
        });
    }
});
// 获取推荐培养方案模板
router.get('/templates/:targetRole', auth_1.authenticateToken, async (req, res) => {
    try {
        const { targetRole } = req.params;
        const template = await cultivationService_1.default.getRecommendedTemplate(targetRole);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: '未找到该角色的培养方案模板',
            });
        }
        res.json({
            success: true,
            data: template,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取培养方案模板失败',
        });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map