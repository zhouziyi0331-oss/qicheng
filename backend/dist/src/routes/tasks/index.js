"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 指令4: 任务系统全流程
 * GET  /tasks/market               — 任务大厅 (登录即可看)
 * GET  /tasks/my                   — 学生: 我的任务列表
 * GET  /tasks/recommended          — 学生: 获取定向推送任务(2-3个)
 * GET  /tasks/:id                  — 任务详情
 * POST /tasks/:id/accept           — 学生: 接单
 * GET  /tasks/:id/steps            — 学生: 获取任务步骤
 * POST /tasks/:id/steps/:num/done  — 学生: 完成一个子步骤
 * POST /tasks/:id/submit           — 学生: 提交交付物
 * POST /company/tasks              — 企业: 发布任务
 * GET  /company/tasks              — 企业: 获取任务列表
 * POST /company/tasks/:id/approve  — 企业: 验收通过
 * POST /company/tasks/:id/reject   — 企业: 验收打回
 *
 * 完整业务流程路由 (新增):
 * POST /tasks/flow/ai-price-suggestion      — 企业: 获取AI价格建议
 * POST /tasks/flow/publish-with-deposit     — 企业: 发布任务并支付定金
 * GET  /tasks/flow/:taskId/matched-students — 企业: 查看AI匹配的10个学生
 * POST /tasks/flow/:taskId/select-students  — 企业: 选择5个学生发送邀请
 * GET  /tasks/flow/invitations              — 学生: 查看收到的任务邀请
 * POST /tasks/flow/:taskId/accept           — 学生: 接受任务邀请
 * POST /tasks/flow/:taskId/reject           — 学生: 拒绝任务邀请
 * POST /tasks/flow/:taskId/progress         — 学生: 更新任务进度
 * POST /tasks/flow/:taskId/deliverables     — 学生: 提交交付物
 * GET  /tasks/flow/:taskId/deliverables     — 企业: 查看交付物
 * POST /tasks/flow/:taskId/approve-and-pay  — 企业: 验收通过并支付尾款
 * POST /tasks/flow/:taskId/final-confirm    — 企业: 最终确认
 * POST /tasks/flow/:taskId/supplement       — 企业: 补充需求
 */
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const studentCtrl = __importStar(require("./studentController"));
const companyCtrl = __importStar(require("./companyController"));
const matchingCtrl = __importStar(require("./matchingController"));
const businessFlowRoutes_1 = __importDefault(require("./businessFlowRoutes"));
const router = (0, express_1.Router)();
// ============================================
// 完整业务流程路由 (新增)
// ============================================
router.use('/flow', businessFlowRoutes_1.default);
// ============================================
// 语义匹配系统路由 (新增)
// ============================================
// 企业端匹配API
router.post('/:taskId/trigger-matching', auth_1.authenticate, (0, auth_1.requireRole)('company'), matchingCtrl.triggerMatching);
router.post('/:taskId/rematch', auth_1.authenticate, (0, auth_1.requireRole)('company'), matchingCtrl.rematchTask);
router.get('/:taskId/matched-students', auth_1.authenticate, (0, auth_1.requireRole)('company'), matchingCtrl.getMatchedStudents);
router.post('/:taskId/push-to-students', auth_1.authenticate, (0, auth_1.requireRole)('company'), matchingCtrl.pushToStudents);
router.get('/:taskId/matching-stats', auth_1.authenticate, (0, auth_1.requireRole)('company'), matchingCtrl.getMatchingStats);
// 学生端匹配API
router.get('/students/recommended-tasks', auth_1.authenticate, (0, auth_1.requireRole)('student'), matchingCtrl.getRecommendedTasks);
router.get('/:taskId/translation', auth_1.authenticate, matchingCtrl.getTaskTranslation);
router.post('/:taskId/accept-recommendation', auth_1.authenticate, (0, auth_1.requireRole)('student'), matchingCtrl.acceptRecommendation);
// 公开/登录可见
router.get('/market', auth_1.authenticate, studentCtrl.getMarketTasks);
router.get('/matched', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.getMatchedTasks);
router.get('/my', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.getMyTasks);
router.get('/recommended', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.getRecommendedTasks);
router.get('/:id', auth_1.authenticate, studentCtrl.getTaskDetail);
// 学生端操作
router.post('/:id/accept', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.acceptTask);
router.get('/:id/steps', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.getTaskSteps);
router.post('/:id/steps/:num/done', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.completeStep);
router.post('/:id/progress', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.updateProgress);
router.post('/:id/submit', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.submitTask);
router.get('/:id/supplements', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.getTaskSupplements);
router.post('/:id/supplements/:supplementId/respond', auth_1.authenticate, (0, auth_1.requireRole)('student'), studentCtrl.respondToSupplement);
// 企业端
router.post('/company', auth_1.authenticate, (0, auth_1.requireRole)('company'), companyCtrl.createTask);
router.get('/company', auth_1.authenticate, (0, auth_1.requireRole)('company'), companyCtrl.getCompanyTasks);
router.post('/company/:id/approve', auth_1.authenticate, (0, auth_1.requireRole)('company'), companyCtrl.approveTask);
router.post('/company/:id/reject', auth_1.authenticate, (0, auth_1.requireRole)('company'), companyCtrl.rejectTask);
exports.default = router;
//# sourceMappingURL=index.js.map