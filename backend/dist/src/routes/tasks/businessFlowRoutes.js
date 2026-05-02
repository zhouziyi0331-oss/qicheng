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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
// 导入控制器
const businessFlowController = __importStar(require("./businessFlowController"));
const studentFlowController = __importStar(require("./studentFlowController"));
const verificationFlowController = __importStar(require("./verificationFlowController"));
const router = (0, express_1.Router)();
// ============================================
// 企业端 - 发布任务流程
// ============================================
// 1. 获取AI价格建议
router.post('/ai-price-suggestion', auth_1.authenticate, businessFlowController.getAIPriceSuggestion);
// 2. 发布任务并支付定金
router.post('/publish-with-deposit', auth_1.authenticate, businessFlowController.publishTaskWithDeposit);
// 3. 查看AI匹配的10个学生
router.get('/:taskId/matched-students', auth_1.authenticate, businessFlowController.getMatchedStudents);
// 4. 从10个中选择5个学生发送邀请
router.post('/:taskId/select-students', auth_1.authenticate, businessFlowController.selectStudentsForInvitation);
// ============================================
// 学生端 - 接单流程
// ============================================
// 1. 查看收到的任务邀请
router.get('/invitations', auth_1.authenticate, studentFlowController.getTaskInvitations);
// 2. 接受任务邀请
router.post('/:taskId/accept', auth_1.authenticate, studentFlowController.acceptTaskInvitation);
// 3. 拒绝任务邀请
router.post('/:taskId/reject', auth_1.authenticate, studentFlowController.rejectTaskInvitation);
// 4. 更新任务进度
router.post('/:taskId/progress', auth_1.authenticate, studentFlowController.updateTaskProgress);
// 5. 提交交付物
router.post('/:taskId/deliverables', auth_1.authenticate, studentFlowController.submitDeliverables);
// ============================================
// 企业端 - 验收和支付流程
// ============================================
// 1. 查看交付物
router.get('/:taskId/deliverables', auth_1.authenticate, verificationFlowController.getTaskDeliverables);
// 2. 验收通过并支付尾款
router.post('/:taskId/approve-and-pay', auth_1.authenticate, verificationFlowController.approveAndPayFinal);
// 2.5 拒绝验收（打回重做）
router.post('/:taskId/reject-deliverable', auth_1.authenticate, verificationFlowController.rejectDeliverable);
// 3. 最终确认
router.post('/:taskId/final-confirm', auth_1.authenticate, verificationFlowController.finalConfirmation);
// 4. 企业补充需求
router.post('/:taskId/supplement', auth_1.authenticate, verificationFlowController.addRequirementSupplement);
exports.default = router;
//# sourceMappingURL=businessFlowRoutes.js.map