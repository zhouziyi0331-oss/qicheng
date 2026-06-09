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
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const orderStatusService_1 = __importStar(require("../services/orderStatusService"));
const logger_1 = __importDefault(require("../utils/logger"));
const db_1 = require("../utils/db");
const router = (0, express_1.Router)();
/**
 * 学生接单
 * POST /api/v1/orders/:orderId/accept
 */
router.post('/:orderId/accept', auth_1.authenticate, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.id;
        // 验证订单
        const order = await (0, db_1.queryOne)(`SELECT id, student_id, status FROM orders WHERE id = $1`, [orderId]);
        if (!order) {
            return res.status(404).json({ error: '订单不存在' });
        }
        if (order.student_id !== userId) {
            return res.status(403).json({ error: '无权操作此订单' });
        }
        if (order.status !== orderStatusService_1.OrderStatus.PENDING) {
            return res.status(400).json({ error: '订单状态不允许此操作' });
        }
        // 更新订单状态（自动触发T-01）
        await orderStatusService_1.default.updateOrderStatus(orderId, orderStatusService_1.OrderStatus.ACCEPTED);
        logger_1.default.info(`Order accepted: ${orderId} by student ${userId}`);
        res.json({
            success: true,
            message: '接单成功，启程老师将为你提供引导'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to accept order:', error);
        res.status(500).json({ error: '接单失败' });
    }
});
/**
 * 学生提交交付物
 * POST /api/v1/orders/:orderId/submit
 */
router.post('/:orderId/submit', auth_1.authenticate, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { submissionContent, submissionFiles } = req.body;
        const userId = req.user?.id;
        // 验证订单
        const order = await (0, db_1.queryOne)(`SELECT id, student_id, status FROM orders WHERE id = $1`, [orderId]);
        if (!order) {
            return res.status(404).json({ error: '订单不存在' });
        }
        if (order.student_id !== userId) {
            return res.status(403).json({ error: '无权操作此订单' });
        }
        // 保存提交物
        await (0, db_1.query)(`INSERT INTO order_submissions (order_id, submission_content, submission_files, created_at)
       VALUES ($1, $2, $3, NOW())`, [orderId, submissionContent, submissionFiles]);
        // 更新订单状态（自动触发AI-03预审核）
        await orderStatusService_1.default.updateOrderStatus(orderId, orderStatusService_1.OrderStatus.SUBMITTED, { submissionContent, submissionFiles });
        logger_1.default.info(`Order submitted: ${orderId} by student ${userId}`);
        res.json({
            success: true,
            message: '提交成功，正在进行预审核'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to submit order:', error);
        res.status(500).json({ error: '提交失败' });
    }
});
/**
 * 企业打回修改
 * POST /api/v1/orders/:orderId/request-revision
 */
router.post('/:orderId/request-revision', auth_1.authenticate, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { feedback } = req.body;
        const userId = req.user?.id;
        // 验证订单
        const order = await (0, db_1.queryOne)(`SELECT o.id, o.status, t.company_id
       FROM orders o
       JOIN tasks t ON o.task_id = t.id
       WHERE o.id = $1`, [orderId]);
        if (!order) {
            return res.status(404).json({ error: '订单不存在' });
        }
        if (order.company_id !== userId) {
            return res.status(403).json({ error: '无权操作此订单' });
        }
        if (order.status !== orderStatusService_1.OrderStatus.SUBMITTED) {
            return res.status(400).json({ error: '订单状态不允许此操作' });
        }
        // 保存反馈
        await (0, db_1.query)(`UPDATE order_submissions
       SET revision_feedback = $1, revision_requested_at = NOW()
       WHERE order_id = $2
       ORDER BY created_at DESC
       LIMIT 1`, [feedback, orderId]);
        // 更新订单状态（自动触发T-03）
        await orderStatusService_1.default.updateOrderStatus(orderId, orderStatusService_1.OrderStatus.REVISION_REQUESTED, { companyFeedback: feedback });
        logger_1.default.info(`Revision requested for order: ${orderId} by company ${userId}`);
        res.json({
            success: true,
            message: '已发送修改建议，启程老师将帮助学生理解'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to request revision:', error);
        res.status(500).json({ error: '操作失败' });
    }
});
/**
 * 企业确认完成
 * POST /api/v1/orders/:orderId/complete
 */
router.post('/:orderId/complete', auth_1.authenticate, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { rating, review } = req.body;
        const userId = req.user?.id;
        // 验证订单
        const order = await (0, db_1.queryOne)(`SELECT o.id, o.status, t.company_id
       FROM orders o
       JOIN tasks t ON o.task_id = t.id
       WHERE o.id = $1`, [orderId]);
        if (!order) {
            return res.status(404).json({ error: '订单不存在' });
        }
        if (order.company_id !== userId) {
            return res.status(403).json({ error: '无权操作此订单' });
        }
        if (order.status !== orderStatusService_1.OrderStatus.SUBMITTED) {
            return res.status(400).json({ error: '订单状态不允许此操作' });
        }
        // 保存评价
        if (rating || review) {
            await (0, db_1.query)(`INSERT INTO order_reviews (order_id, rating, review, created_at)
         VALUES ($1, $2, $3, NOW())`, [orderId, rating, review]);
        }
        // 更新订单状态（自动触发AI-04成长报告 + T-05里程碑见证）
        await orderStatusService_1.default.updateOrderStatus(orderId, orderStatusService_1.OrderStatus.COMPLETED);
        logger_1.default.info(`Order completed: ${orderId} by company ${userId}`);
        res.json({
            success: true,
            message: '订单已完成，学生的成长报告正在生成'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to complete order:', error);
        res.status(500).json({ error: '操作失败' });
    }
});
/**
 * 记录学生活动
 * POST /api/v1/orders/:orderId/activity
 */
router.post('/:orderId/activity', auth_1.authenticate, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user?.id;
        // 验证订单
        const order = await (0, db_1.queryOne)(`SELECT id, student_id FROM orders WHERE id = $1`, [orderId]);
        if (!order) {
            return res.status(404).json({ error: '订单不存在' });
        }
        if (order.student_id !== userId) {
            return res.status(403).json({ error: '无权操作此订单' });
        }
        // 记录活动
        await orderStatusService_1.default.recordStudentActivity(orderId);
        res.json({
            success: true
        });
    }
    catch (error) {
        logger_1.default.error('Failed to record activity:', error);
        res.status(500).json({ error: '记录失败' });
    }
});
exports.default = router;
//# sourceMappingURL=orderFlowRoutes.js.map