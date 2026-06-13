"use strict";
/**
 * Trust Accelerator API Routes
 * 信任加速器相关接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const matchService_1 = require("../../services/trustAccelerator/matchService");
const verifyService_1 = require("../../services/trustAccelerator/verifyService");
const unlockService_1 = require("../../services/trustAccelerator/unlockService");
const ritualService_1 = require("../../services/trustAccelerator/ritualService");
const router = (0, express_1.Router)();
/**
 * GET /api/trust/eligible-matches
 * 获取学生的所有解锁资格
 */
router.get('/eligible-matches', async (req, res) => {
    try {
        const studentId = req.user?.id;
        if (!studentId) {
            return res.status(401).json({ error: '未登录' });
        }
        const matches = await matchService_1.MatchService.getEligibleMatches(studentId);
        res.json({
            success: true,
            data: matches
        });
    }
    catch (error) {
        logger.error('[Trust API] 获取解锁资格失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/trust/match-status/:companyId
 * 查询与某商家的合作状态
 */
router.get('/match-status/:companyId', async (req, res) => {
    try {
        const studentId = req.user?.id;
        const { companyId } = req.params;
        if (!studentId) {
            return res.status(401).json({ error: '未登录' });
        }
        const match = await matchService_1.MatchService.getMatchStatus(studentId, companyId);
        const matchReason = match
            ? await matchService_1.MatchService.generateMatchReason(studentId, companyId)
            : null;
        res.json({
            success: true,
            data: {
                match,
                matchReason,
                unlockEligible: match?.unlock_eligible || false
            }
        });
    }
    catch (error) {
        logger.error('[Trust API] 查询匹配状态失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/trust/verify/start
 * 开始验证流程
 */
router.post('/verify/start', async (req, res) => {
    try {
        const studentId = req.user?.id;
        const { companyId, matchId } = req.body;
        if (!studentId) {
            return res.status(401).json({ error: '未登录' });
        }
        if (!companyId || !matchId) {
            return res.status(400).json({ error: '缺少必要参数' });
        }
        const result = await verifyService_1.VerifyService.createSession(studentId, companyId, matchId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('[Trust API] 创建验证会话失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/trust/verify/round1
 * 提交第一轮回答
 */
router.post('/verify/round1', async (req, res) => {
    try {
        const { sessionId, answer } = req.body;
        if (!sessionId || !answer) {
            return res.status(400).json({ error: '缺少必要参数' });
        }
        const result = await verifyService_1.VerifyService.submitRound1Answer(sessionId, answer);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('[Trust API] 提交第一轮回答失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/trust/verify/round2
 * 提交第二轮回答
 */
router.post('/verify/round2', async (req, res) => {
    try {
        const { sessionId, answer } = req.body;
        if (!sessionId || !answer) {
            return res.status(400).json({ error: '缺少必要参数' });
        }
        const result = await verifyService_1.VerifyService.submitRound2Answer(sessionId, answer);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('[Trust API] 提交第二轮回答失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/trust/verify/status/:sessionId
 * 轮询验证状态
 */
router.get('/verify/status/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await verifyService_1.VerifyService.getSessionStatus(sessionId);
        // 如果是round1_pass，返回第二轮题目
        let round2Question = null;
        if (session.status === 'round1_pass') {
            round2Question = await verifyService_1.VerifyService.getRound2Question(sessionId);
        }
        res.json({
            success: true,
            data: {
                status: session.status,
                round1Result: session.round1_result,
                round1RetryPrompt: session.round1_retry_prompt,
                round2Question,
                expiresAt: session.expires_at
            }
        });
    }
    catch (error) {
        logger.error('[Trust API] 获取验证状态失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/trust/unlock/create-payment
 * 创建解锁支付订单
 */
router.post('/unlock/create-payment', async (req, res) => {
    try {
        const studentId = req.user?.id;
        const { sessionId } = req.body;
        if (!studentId) {
            return res.status(401).json({ error: '未登录' });
        }
        if (!sessionId) {
            return res.status(400).json({ error: '缺少会话ID' });
        }
        const payment = await unlockService_1.UnlockService.createUnlockPayment(studentId, sessionId);
        // TODO: 调用微信支付统一下单接口
        // 目前返回模拟数据
        res.json({
            success: true,
            data: {
                paymentId: payment.paymentId,
                outTradeNo: payment.outTradeNo,
                amountFen: payment.amountFen,
                // 微信支付参数（模拟）
                wxPayParams: {
                    appId: 'wx1fee66066d2df5cd',
                    timeStamp: Math.floor(Date.now() / 1000).toString(),
                    nonceStr: Math.random().toString(36).substring(2, 15),
                    package: `prepay_id=mock_prepay_${payment.outTradeNo}`,
                    signType: 'RSA',
                    paySign: 'mock_sign'
                }
            }
        });
    }
    catch (error) {
        logger.error('[Trust API] 创建解锁支付失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/trust/unlock/payment-callback
 * 微信支付回调（内部接口）
 */
router.post('/unlock/payment-callback', async (req, res) => {
    try {
        const { out_trade_no, transaction_id } = req.body;
        // TODO: 验证微信支付签名
        const result = await unlockService_1.UnlockService.handlePaymentSuccess(out_trade_no, transaction_id);
        // 异步生成证书
        ritualService_1.RitualService.generateCertificate(result.unlockRecordId).catch(err => {
            logger.error('[Trust API] 生成证书失败:', err);
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger.error('[Trust API] 处理支付回调失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/trust/unlock/record/:companyId
 * 获取解锁记录
 */
router.get('/unlock/record/:companyId', async (req, res) => {
    try {
        const studentId = req.user?.id;
        const { companyId } = req.params;
        if (!studentId) {
            return res.status(401).json({ error: '未登录' });
        }
        const record = await unlockService_1.UnlockService.getUnlockRecord(studentId, companyId);
        res.json({
            success: true,
            data: record
        });
    }
    catch (error) {
        logger.error('[Trust API] 获取解锁记录失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/trust/unlock/view-contact
 * 记录查看联系方式
 */
router.post('/unlock/view-contact', async (req, res) => {
    try {
        const { unlockRecordId } = req.body;
        if (!unlockRecordId) {
            return res.status(400).json({ error: '缺少解锁记录ID' });
        }
        await unlockService_1.UnlockService.recordContactViewed(unlockRecordId);
        res.json({ success: true });
    }
    catch (error) {
        logger.error('[Trust API] 记录查看失败:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/trust/unlock/feedback
 * 提交反馈
 */
router.post('/unlock/feedback', async (req, res) => {
    try {
        const { unlockRecordId, studentContacted, merchantContacted } = req.body;
        if (!unlockRecordId) {
            return res.status(400).json({ error: '缺少解锁记录ID' });
        }
        await unlockService_1.UnlockService.collectFeedback(unlockRecordId, studentContacted, merchantContacted);
        res.json({ success: true });
    }
    catch (error) {
        logger.error('[Trust API] 提交反馈失败:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map