"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = exports.PaymentController = void 0;
const payment_service_1 = require("../services/payment.service");
const axios_1 = __importDefault(require("axios"));
class PaymentController {
    /**
     * POST /api/payment/create-order
     * 创建支付订单
     */
    async createOrder(req, res) {
        try {
            const { itemType, itemId, itemTitle, amount, paymentMethod = 'wechat' } = req.body;
            const userId = req.userId;
            if (!itemType || !itemId || !itemTitle || !amount) {
                return res.status(400).json({ error: '缺少必要参数' });
            }
            // 验证itemType
            const validItemTypes = ['decomposition_report', 'graduation_report', 'practice_unlock', 'other'];
            if (!validItemTypes.includes(itemType)) {
                return res.status(400).json({ error: '无效的项目类型' });
            }
            // 验证是否已支付
            const hasPaid = await payment_service_1.paymentService.verifyPayment(userId, itemType, itemId);
            if (hasPaid) {
                return res.status(400).json({ error: '该内容已解锁，无需重复支付' });
            }
            // 创建支付订单
            const payment = await payment_service_1.paymentService.createPayment({
                userId: userId,
                itemType,
                itemId,
                itemTitle,
                amount,
                paymentMethod,
                remark: req.body.remark
            });
            // 如果是真实支付，调用微信/支付宝API
            if (paymentMethod === 'wechat' || paymentMethod === 'alipay') {
                const paymentResult = await this.requestWechatPayment({
                    outTradeNo: payment.orderId,
                    amount,
                    description: itemTitle,
                    openId: req.body.openId
                });
                res.json({
                    success: true,
                    orderId: payment.orderId,
                    payment: paymentResult
                });
            }
            else {
                // Mock支付直接返回订单信息
                res.json({
                    success: true,
                    orderId: payment.orderId,
                    payment: {
                        _id: payment._id,
                        orderId: payment.orderId,
                        status: payment.status,
                        amount: payment.amount,
                        createdAt: payment.createdAt
                    }
                });
            }
        }
        catch (error) {
            console.error('创建支付订单失败:', error);
            res.status(500).json({ error: '创建支付订单失败' });
        }
    }
    /**
     * POST /api/payment/mock-pay
     * 模拟支付成功（仅开发/测试环境）
     */
    async mockPayment(req, res) {
        try {
            const { orderId } = req.body;
            if (!orderId) {
                return res.status(400).json({ error: '缺少订单号' });
            }
            // 验证环境
            if (process.env.NODE_ENV === 'production') {
                return res.status(403).json({ error: '生产环境不允许模拟支付' });
            }
            const payment = await payment_service_1.paymentService.mockPaymentSuccess(orderId);
            res.json({
                success: true,
                message: '支付成功',
                payment: {
                    orderId: payment.orderId,
                    status: payment.status,
                    paidAt: payment.paidAt,
                    amount: payment.amount
                }
            });
        }
        catch (error) {
            console.error('模拟支付失败:', error);
            res.status(500).json({ error: error.message || '模拟支付失败' });
        }
    }
    /**
     * POST /api/payment/notify
     * 微信支付回调通知
     */
    async wechatNotify(req, res) {
        try {
            // 1. 验证微信签名
            const isValid = this.verifyWechatSignature(req.body);
            if (!isValid) {
                return res.status(400).json({ code: 'FAIL', message: '签名验证失败' });
            }
            // 2. 解析支付结果
            const { out_trade_no, transaction_id, trade_state, total_fee } = req.body;
            if (trade_state !== 'SUCCESS') {
                return res.json({ code: 'SUCCESS', message: '已接收通知' });
            }
            // 3. 查找支付订单
            const payment = await payment_service_1.paymentService.getPaymentByOrderId(out_trade_no);
            if (!payment) {
                console.error(`订单不存在: ${out_trade_no}`);
                return res.status(404).json({ code: 'FAIL', message: '订单不存在' });
            }
            // 4. 更新支付状态
            if (payment.status !== 'success') {
                payment.status = 'success';
                payment.paidAt = new Date();
                payment.outTradeNo = transaction_id;
                if (total_fee) {
                    payment.amount = parseFloat(total_fee) / 100; // 分转元
                }
                await payment.save();
                console.log(`✓ 支付成功: ${out_trade_no}, 微信订单号: ${transaction_id}`);
            }
            // 5. 返回成功响应（重要：必须返回成功，否则微信会重复通知）
            res.json({ code: 'SUCCESS', message: '成功' });
        }
        catch (error) {
            console.error('处理微信支付回调失败:', error);
            res.status(500).json({ code: 'FAIL', message: '处理失败' });
        }
    }
    /**
     * POST /api/payment/check-status
     * 查询支付状态
     */
    async checkPaymentStatus(req, res) {
        try {
            const { orderId } = req.body;
            const userId = req.userId;
            if (!orderId) {
                return res.status(400).json({ error: '缺少订单号' });
            }
            const payment = await payment_service_1.paymentService.getPaymentByOrderId(orderId);
            if (!payment) {
                return res.status(404).json({ error: '订单不存在' });
            }
            if (payment.userId.toString() !== userId) {
                return res.status(403).json({ error: '无权查询此订单' });
            }
            res.json({
                orderId: payment.orderId,
                itemType: payment.itemType,
                itemId: payment.itemId,
                itemTitle: payment.itemTitle,
                status: payment.status,
                isPaid: payment.status === 'success',
                paidAt: payment.paidAt,
                amount: payment.amount,
                paymentMethod: payment.paymentMethod,
                createdAt: payment.createdAt
            });
        }
        catch (error) {
            console.error('查询支付状态失败:', error);
            res.status(500).json({ error: '查询失败' });
        }
    }
    /**
     * GET /api/payment/history
     * 获取用户支付历史
     */
    async getPaymentHistory(req, res) {
        try {
            const userId = req.userId;
            const { status, itemType, limit, skip } = req.query;
            const payments = await payment_service_1.paymentService.getUserPayments(userId, {
                status: status,
                itemType: itemType,
                limit: limit ? parseInt(limit) : 20,
                skip: skip ? parseInt(skip) : 0
            });
            res.json({
                success: true,
                payments: payments.map(p => ({
                    orderId: p.orderId,
                    itemType: p.itemType,
                    itemId: p.itemId,
                    itemTitle: p.itemTitle,
                    amount: p.amount,
                    status: p.status,
                    paymentMethod: p.paymentMethod,
                    createdAt: p.createdAt,
                    paidAt: p.paidAt
                }))
            });
        }
        catch (error) {
            console.error('获取支付历史失败:', error);
            res.status(500).json({ error: '获取支付历史失败' });
        }
    }
    /**
     * 调用微信支付统一下单API
     */
    async requestWechatPayment(params) {
        const appId = process.env.WECHAT_APP_ID;
        const mchId = process.env.WECHAT_MCH_ID;
        const apiKey = process.env.WECHAT_API_KEY;
        if (!appId || !mchId || !apiKey) {
            // 开发环境：返回模拟支付结果
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️  开发模式：使用模拟支付');
                return {
                    prepay_id: `mock_prepay_${Date.now()}`,
                    code_url: 'mock_code_url'
                };
            }
            throw new Error('未配置微信支付参数');
        }
        // 这里应该调用微信支付统一下单API
        // 具体实现需要参考微信支付官方文档
        // https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_5_1.shtml
        try {
            // TODO: 实现真实的微信支付调用
            const response = await axios_1.default.post('https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi', {
                appid: appId,
                mchid: mchId,
                description: params.description,
                out_trade_no: params.outTradeNo,
                amount: {
                    total: Math.round(params.amount * 100), // 元转分
                    currency: 'CNY'
                },
                payer: {
                    openid: params.openId
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('调用微信支付API失败:', error);
            throw error;
        }
    }
    /**
     * 验证微信签名
     */
    verifyWechatSignature(data) {
        // TODO: 实现微信签名验证
        // 参考: https://pay.weixin.qq.com/wiki/doc/apiv3/wechatpay/wechatpay4_1.shtml
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️  开发模式：跳过签名验证');
            return true;
        }
        // 实际生产环境必须验证签名
        return true;
    }
}
exports.PaymentController = PaymentController;
exports.paymentController = new PaymentController();
//# sourceMappingURL=payment.controller.js.map