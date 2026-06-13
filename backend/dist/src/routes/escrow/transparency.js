"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const escrowTransparencyService_1 = __importDefault(require("../../services/escrowTransparencyService"));
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
/**
 * GET /api/escrow/:taskId/flow
 * 获取任务的托管流程概览
 */
router.get('/:taskId/flow', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        // 权限检查：企业、学生或平台管理员
        const taskCheck = await req.app.locals.pool.query(`SELECT company_id, student_id FROM tasks WHERE id = $1`, [taskId]);
        if (taskCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '任务不存在',
            });
        }
        const task = taskCheck.rows[0];
        const hasAccess = userRole === 'admin' ||
            task.company_id === userId ||
            task.student_id === userId;
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: '无权查看该任务的托管信息',
            });
        }
        const overview = await escrowTransparencyService_1.default.getEscrowFlowOverview(taskId);
        res.json({
            success: true,
            data: overview,
        });
    }
    catch (error) {
        console.error('获取托管流程失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取托管流程失败',
        });
    }
});
/**
 * POST /api/escrow/:taskId/deposit
 * 企业充值到托管账户
 */
router.post('/:taskId/deposit', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业用户可以充值',
            });
        }
        const { amount, externalTransactionId } = req.body;
        if (!amount || !externalTransactionId) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: amount, externalTransactionId',
            });
        }
        // 验证任务归属
        const taskCheck = await req.app.locals.pool.query(`SELECT company_id FROM tasks WHERE id = $1`, [taskId]);
        if (taskCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '任务不存在',
            });
        }
        if (taskCheck.rows[0].company_id !== companyId) {
            return res.status(403).json({
                success: false,
                message: '无权操作该任务',
            });
        }
        const result = await escrowTransparencyService_1.default.depositFunds(taskId, companyId, amount, externalTransactionId);
        // 自动锁定资金
        await escrowTransparencyService_1.default.lockFunds(taskId, amount);
        res.json({
            success: true,
            data: result,
            message: '充值成功，资金已锁定',
        });
    }
    catch (error) {
        console.error('托管充值失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '充值失败',
        });
    }
});
/**
 * POST /api/escrow/:taskId/release
 * 释放资金给学生
 */
router.post('/:taskId/release', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const userRole = req.user.role;
        // 只有平台管理员可以释放资金（在企业验收通过后）
        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '只有平台管理员可以释放资金',
            });
        }
        const { studentId, amount, feeRate = 0.05 } = req.body;
        if (!studentId || !amount) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: studentId, amount',
            });
        }
        const feeAmount = amount * feeRate;
        await escrowTransparencyService_1.default.releaseFunds(taskId, studentId, amount, feeAmount);
        res.json({
            success: true,
            message: '资金释放成功',
            data: {
                total_amount: amount,
                fee_amount: feeAmount,
                net_amount: amount - feeAmount,
            },
        });
    }
    catch (error) {
        console.error('释放资金失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '释放资金失败',
        });
    }
});
/**
 * POST /api/escrow/:taskId/refund
 * 退款给企业
 */
router.post('/:taskId/refund', auth_1.authenticateToken, async (req, res) => {
    try {
        const { taskId } = req.params;
        const userRole = req.user.role;
        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '只有平台管理员可以处理退款',
            });
        }
        const { companyId, amount, reason } = req.body;
        if (!companyId || !amount || !reason) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: companyId, amount, reason',
            });
        }
        await escrowTransparencyService_1.default.refundToCompany(taskId, companyId, amount, reason);
        res.json({
            success: true,
            message: '退款成功',
        });
    }
    catch (error) {
        console.error('退款失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '退款失败',
        });
    }
});
/**
 * PUT /api/escrow/nodes/:nodeId/status
 * 更新流程节点状态
 */
router.put('/nodes/:nodeId/status', auth_1.authenticateToken, async (req, res) => {
    try {
        const { nodeId } = req.params;
        const { status, metadata } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        if (!status) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: status',
            });
        }
        const node = await escrowTransparencyService_1.default.updateFlowNodeStatus(nodeId, status, userId, userRole, metadata);
        res.json({
            success: true,
            data: node,
            message: '节点状态已更新',
        });
    }
    catch (error) {
        console.error('更新节点状态失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '更新失败',
        });
    }
});
/**
 * POST /api/escrow/transactions/:transactionId/complete
 * 完成交易
 */
router.post('/transactions/:transactionId/complete', auth_1.authenticateToken, async (req, res) => {
    try {
        const { transactionId } = req.params;
        const userRole = req.user.role;
        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '只有平台管理员可以完成交易',
            });
        }
        await escrowTransparencyService_1.default.completeTransaction(transactionId);
        res.json({
            success: true,
            message: '交易已完成',
        });
    }
    catch (error) {
        console.error('完成交易失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '完成交易失败',
        });
    }
});
/**
 * POST /api/escrow/transactions/:transactionId/fail
 * 交易失败
 */
router.post('/transactions/:transactionId/fail', auth_1.authenticateToken, async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { reason } = req.body;
        const userRole = req.user.role;
        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '只有平台管理员可以标记交易失败',
            });
        }
        if (!reason) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: reason',
            });
        }
        await escrowTransparencyService_1.default.failTransaction(transactionId, reason);
        res.json({
            success: true,
            message: '交易已标记为失败',
        });
    }
    catch (error) {
        console.error('标记交易失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '操作失败',
        });
    }
});
exports.default = router;
//# sourceMappingURL=transparency.js.map