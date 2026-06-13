"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const acceptanceService_1 = __importDefault(require("../../services/acceptanceService"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
/**
 * E-29: 逐项验收清单
 */
// 创建验收清单
router.post('/tasks/:taskId/checklist', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { items } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供清单项',
            });
        }
        const checklist = await acceptanceService_1.default.createChecklist(taskId, items);
        res.json({
            success: true,
            data: checklist,
            message: '验收清单创建成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '创建验收清单失败',
        });
    }
});
// 更新清单项
router.put('/checklists/:checklistId/items/:itemId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { checklistId, itemId } = req.params;
        const { status } = req.body;
        const checkedBy = req.user.userId;
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的状态',
            });
        }
        const checklist = await acceptanceService_1.default.updateChecklistItem(checklistId, parseInt(itemId), status, checkedBy);
        res.json({
            success: true,
            data: checklist,
            message: '清单项更新成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '更新清单项失败',
        });
    }
});
// 获取验收清单
router.get('/tasks/:taskId/checklist', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const checklist = await acceptanceService_1.default.getChecklist(taskId);
        res.json({
            success: true,
            data: checklist,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取验收清单失败',
        });
    }
});
/**
 * E-30: 修改意见模板化
 */
// 获取修改意见模板列表
router.get('/revision-templates', auth_1.authenticateToken, async (req, res) => {
    try {
        const { category } = req.query;
        const templates = await acceptanceService_1.default.getRevisionTemplates(category);
        res.json({
            success: true,
            data: templates,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取模板列表失败',
        });
    }
});
// 使用模板生成修改意见
router.post('/revision-templates/:templateId/apply', auth_1.authenticateToken, async (req, res) => {
    try {
        const { templateId } = req.params;
        const { placeholder_values } = req.body;
        if (!placeholder_values || typeof placeholder_values !== 'object') {
            return res.status(400).json({
                success: false,
                message: '请提供占位符值',
            });
        }
        const content = await acceptanceService_1.default.applyRevisionTemplate(templateId, placeholder_values);
        res.json({
            success: true,
            data: { content },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '应用模板失败',
        });
    }
});
/**
 * E-31: 维度化验收评分
 */
// 创建维度化评分
router.post('/tasks/:taskId/dimensional-score', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const companyId = req.user.userId;
        const score = await acceptanceService_1.default.createDimensionalScore({
            task_id: taskId,
            company_id: companyId,
            ...req.body,
        });
        res.json({
            success: true,
            data: score,
            message: '评分提交成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '提交评分失败',
        });
    }
});
// 获取维度评分
router.get('/tasks/:taskId/dimensional-score', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const score = await acceptanceService_1.default.getDimensionalScore(taskId);
        res.json({
            success: true,
            data: score,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取评分失败',
        });
    }
});
// 获取学生评分统计
router.get('/students/:studentId/score-stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const stats = await acceptanceService_1.default.getStudentScoreStats(studentId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取评分统计失败',
        });
    }
});
/**
 * E-32: 愿意再合作标记
 */
// 记录合作意愿
router.post('/cooperation-willingness', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const willingness = await acceptanceService_1.default.recordCooperationWillingness({
            role: userRole,
            ...req.body,
        });
        res.json({
            success: true,
            data: willingness,
            message: '合作意愿已记录',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '记录合作意愿失败',
        });
    }
});
// 获取合作意愿
router.get('/tasks/:taskId/cooperation-willingness', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const willingness = await acceptanceService_1.default.getCooperationWillingness(taskId);
        res.json({
            success: true,
            data: willingness,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取合作意愿失败',
        });
    }
});
// 获取双向愿意合作的记录
router.get('/mutual-cooperation-partners', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const partners = await acceptanceService_1.default.getMutualCooperationPairs(userId, userRole);
        res.json({
            success: true,
            data: partners,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取合作伙伴失败',
        });
    }
});
/**
 * E-33: 知识产权声明
 */
// 创建知识产权声明
router.post('/tasks/:taskId/ip-declaration', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const declaration = await acceptanceService_1.default.createIPDeclaration({
            task_id: taskId,
            ...req.body,
        });
        res.json({
            success: true,
            data: declaration,
            message: '知识产权声明创建成功',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '创建知识产权声明失败',
        });
    }
});
// 确认知识产权声明
router.post('/ip-declarations/:declarationId/confirm', auth_1.authenticateToken, async (req, res) => {
    try {
        const { declarationId } = req.params;
        const userRole = req.user.role;
        const declaration = await acceptanceService_1.default.confirmIPDeclaration(declarationId, userRole);
        res.json({
            success: true,
            data: declaration,
            message: '知识产权声明已确认',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '确认知识产权声明失败',
        });
    }
});
// 获取知识产权声明
router.get('/tasks/:taskId/ip-declaration', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const declaration = await acceptanceService_1.default.getIPDeclaration(taskId);
        res.json({
            success: true,
            data: declaration,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取知识产权声明失败',
        });
    }
});
/**
 * E-34: 退款补偿机制
 */
// 创建退款申请
router.post('/refund-requests', auth_1.authenticateToken, async (req, res) => {
    try {
        const applicantId = req.user.userId;
        const applicantRole = req.user.role;
        const request = await acceptanceService_1.default.createRefundRequest({
            applicant_id: applicantId,
            applicant_role: applicantRole,
            ...req.body,
        });
        res.json({
            success: true,
            data: request,
            message: '退款申请已提交',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '提交退款申请失败',
        });
    }
});
// 审核退款申请
router.post('/refund-requests/:requestId/review', auth_1.authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        const reviewedBy = req.user.userId;
        const { approved, approved_amount, review_comment } = req.body;
        if (approved === undefined) {
            return res.status(400).json({
                success: false,
                message: '请指定是否批准',
            });
        }
        const request = await acceptanceService_1.default.reviewRefundRequest(requestId, reviewedBy, approved, approved_amount, review_comment);
        res.json({
            success: true,
            data: request,
            message: approved ? '退款申请已批准' : '退款申请已拒绝',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '审核退款申请失败',
        });
    }
});
// 处理退款
router.post('/refund-requests/:requestId/process', auth_1.authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { transaction_id } = req.body;
        if (!transaction_id) {
            return res.status(400).json({
                success: false,
                message: '请提供交易ID',
            });
        }
        const request = await acceptanceService_1.default.processRefund(requestId, transaction_id);
        res.json({
            success: true,
            data: request,
            message: '退款已处理',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '处理退款失败',
        });
    }
});
// 获取退款申请列表
router.get('/refund-requests', auth_1.authenticateToken, async (req, res) => {
    try {
        const { applicant_id, status, task_id } = req.query;
        const requests = await acceptanceService_1.default.getRefundRequests({
            applicant_id: applicant_id,
            status: status,
            task_id: task_id,
        });
        res.json({
            success: true,
            data: requests,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || '获取退款申请列表失败',
        });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map