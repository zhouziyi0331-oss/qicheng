"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// 创建支付订单
router.post('/create-order', auth_middleware_1.authMiddleware, (req, res) => payment_controller_1.paymentController.createOrder(req, res));
// 模拟支付成功（仅开发/测试环境）
router.post('/mock-pay', auth_middleware_1.authMiddleware, (req, res) => payment_controller_1.paymentController.mockPayment(req, res));
// 微信支付回调（不需要认证）
router.post('/notify', (req, res) => payment_controller_1.paymentController.wechatNotify(req, res));
// 查询支付状态
router.post('/check-status', auth_middleware_1.authMiddleware, (req, res) => payment_controller_1.paymentController.checkPaymentStatus(req, res));
// 获取支付历史
router.get('/history', auth_middleware_1.authMiddleware, (req, res) => payment_controller_1.paymentController.getPaymentHistory(req, res));
exports.default = router;
//# sourceMappingURL=payment.routes.js.map