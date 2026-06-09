"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkJumpEligibility = checkJumpEligibility;
exports.applyForJumpTest = applyForJumpTest;
exports.submitJumpTest = submitJumpTest;
exports.getJumpHistory = getJumpHistory;
const jumpTestService_1 = __importDefault(require("../../services/jumpTestService"));
const errorHandler_1 = require("../../middleware/errorHandler");
/**
 * 跳级测试控制器
 */
// GET /api/v1/students/jump-eligibility - 检查跳级资格
async function checkJumpEligibility(req, res, next) {
    try {
        const studentId = req.user.userId;
        const eligibility = await jumpTestService_1.default.checkJumpEligibility(studentId);
        res.json({
            success: true,
            data: eligibility,
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /api/v1/students/apply-jump - 申请跳级
async function applyForJumpTest(req, res, next) {
    try {
        const studentId = req.user.userId;
        const result = await jumpTestService_1.default.applyForJumpTest(studentId);
        // 推送测试任务
        const orderId = await jumpTestService_1.default.pushJumpTestTask(studentId, result.jumpRecordId, result.testTask);
        res.json({
            success: true,
            message: '跳级申请成功，测试任务已推送',
            data: {
                jumpRecordId: result.jumpRecordId,
                orderId,
                testTask: result.testTask,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// POST /api/v1/students/submit-jump-test - 提交跳级测试
async function submitJumpTest(req, res, next) {
    try {
        const studentId = req.user.userId;
        const { orderId, submissionContent, fileUrls } = req.body;
        if (!orderId || !submissionContent) {
            throw new errorHandler_1.AppError(400, '订单ID和提交内容为必填项', 'MISSING_FIELDS');
        }
        // 验证订单归属
        const { query } = require('../../utils/db');
        const order = await query(`SELECT id FROM orders WHERE id = $1 AND student_id = $2 AND order_type = 'jump_test'`, [orderId, studentId]);
        if (order.rows.length === 0) {
            throw new errorHandler_1.AppError(403, '无权操作此订单', 'FORBIDDEN');
        }
        // 审核跳级测试
        const reviewResult = await jumpTestService_1.default.reviewJumpTest(orderId, submissionContent, fileUrls || []);
        res.json({
            success: true,
            message: reviewResult.passed ? '恭喜！跳级测试通过' : '跳级测试未通过',
            data: reviewResult,
        });
    }
    catch (err) {
        next(err);
    }
}
// GET /api/v1/students/jump-history - 获取跳级历史
async function getJumpHistory(req, res, next) {
    try {
        const studentId = req.user.userId;
        const { query } = require('../../utils/db');
        const history = await query(`SELECT
        jtr.*,
        o.created_at as order_created_at,
        o.status as order_status
       FROM jump_test_records jtr
       LEFT JOIN orders o ON jtr.test_order_id = o.id
       WHERE jtr.student_id = $1
       ORDER BY jtr.applied_at DESC`, [studentId]);
        res.json({
            success: true,
            data: history.rows,
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=jumpTestController.js.map