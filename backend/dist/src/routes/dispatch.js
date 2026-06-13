"use strict";
/**
 * 企业端双模式派单系统 API路由
 *
 * 包含：
 * 1. 价格推荐API
 * 2. 指定大师API
 * 3. 邀请管理API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = __importDefault(require("../../utils/logger"));
const priceRecommendationService_1 = __importDefault(require("../services/priceRecommendationService"));
const designatedMasterService_1 = __importDefault(require("../services/designatedMasterService"));
const router = (0, express_1.Router)();
// ============================================
// 价格推荐相关API
// ============================================
/**
 * POST /api/v1/dispatch/price-recommendation
 * 获取价格推荐
 */
router.post('/price-recommendation', async (req, res) => {
    try {
        const { track, difficulty, estimatedHours, deliverableType } = req.body;
        // 参数验证
        if (!track || !difficulty || !estimatedHours) {
            return res.status(400).json({
                success: false,
                message: '缺少必需参数：track, difficulty, estimatedHours'
            });
        }
        if (difficulty < 1 || difficulty > 5) {
            return res.status(400).json({
                success: false,
                message: '难度必须在1-5之间'
            });
        }
        if (estimatedHours < 1 || estimatedHours > 200) {
            return res.status(400).json({
                success: false,
                message: '预估工时必须在1-200小时之间'
            });
        }
        // 计算价格推荐
        const recommendation = await priceRecommendationService_1.default.calculatePriceRecommendation({
            track,
            difficulty,
            estimatedHours,
            deliverableType
        });
        res.json({
            success: true,
            data: recommendation
        });
    }
    catch (error) {
        logger_1.default.error('[价格推荐API] 错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '价格推荐计算失败'
        });
    }
});
/**
 * POST /api/v1/dispatch/validate-price
 * 验证企业出价
 */
router.post('/validate-price', async (req, res) => {
    try {
        const { enterprisePrice, recommendation } = req.body;
        if (!enterprisePrice || !recommendation) {
            return res.status(400).json({
                success: false,
                message: '缺少必需参数'
            });
        }
        const validation = priceRecommendationService_1.default.validateEnterprisePrice(enterprisePrice, recommendation);
        res.json({
            success: true,
            data: validation
        });
    }
    catch (error) {
        logger_1.default.error('[价格验证API] 错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '价格验证失败'
        });
    }
});
// ============================================
// 指定大师相关API
// ============================================
/**
 * GET /api/v1/dispatch/masters
 * 获取大师列表
 */
router.get('/masters', async (req, res) => {
    try {
        const { track, specialties, onlineOnly, minRating } = req.query;
        const filter = {};
        if (track) {
            filter.track = track;
        }
        if (specialties) {
            filter.specialties = Array.isArray(specialties) ? specialties : [specialties];
        }
        if (onlineOnly === 'true') {
            filter.onlineOnly = true;
        }
        if (minRating) {
            filter.minRating = parseFloat(minRating);
        }
        const masters = await designatedMasterService_1.default.getMasterList(filter);
        res.json({
            success: true,
            data: masters
        });
    }
    catch (error) {
        logger_1.default.error('[大师列表API] 错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取大师列表失败'
        });
    }
});
/**
 * GET /api/v1/dispatch/masters/:masterId
 * 获取大师详情
 */
router.get('/masters/:masterId', async (req, res) => {
    try {
        const { masterId } = req.params;
        const master = await designatedMasterService_1.default.getMasterDetail(masterId);
        if (!master) {
            return res.status(404).json({
                success: false,
                message: '大师不存在'
            });
        }
        res.json({
            success: true,
            data: master
        });
    }
    catch (error) {
        logger_1.default.error('[大师详情API] 错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取大师详情失败'
        });
    }
});
/**
 * POST /api/v1/dispatch/invitations
 * 发送邀请给大师
 */
router.post('/invitations', async (req, res) => {
    try {
        const { taskId, enterpriseId, masterId, enterpriseOffer, message } = req.body;
        // 参数验证
        if (!taskId || !enterpriseId || !masterId || !enterpriseOffer) {
            return res.status(400).json({
                success: false,
                message: '缺少必需参数'
            });
        }
        if (enterpriseOffer <= 0) {
            return res.status(400).json({
                success: false,
                message: '出价必须大于0'
            });
        }
        const invitation = await designatedMasterService_1.default.sendInvitation({
            taskId,
            enterpriseId,
            masterId,
            enterpriseOffer,
            message
        });
        res.json({
            success: true,
            data: invitation
        });
    }
    catch (error) {
        logger_1.default.error('[发送邀请API] 错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '发送邀请失败'
        });
    }
});
/**
 * POST /api/v1/dispatch/invitations/:invitationId/respond
 * 大师响应邀请
 */
router.post('/invitations/:invitationId/respond', async (req, res) => {
    try {
        const { invitationId } = req.params;
        const { masterId, action, counterOffer, note } = req.body;
        // 参数验证
        if (!masterId || !action) {
            return res.status(400).json({
                success: false,
                message: '缺少必需参数'
            });
        }
        if (!['accept', 'reject', 'negotiate'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: '无效的操作类型'
            });
        }
        if (action === 'negotiate' && !counterOffer) {
            return res.status(400).json({
                success: false,
                message: '协商时必须提供还价'
            });
        }
        const response = await designatedMasterService_1.default.respondToInvitation(invitationId, masterId, action, counterOffer, note);
        res.json({
            success: true,
            data: response
        });
    }
    catch (error) {
        logger_1.default.error('[响应邀请API] 错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '响应邀请失败'
        });
    }
});
/**
 * GET /api/v1/dispatch/invitations/:invitationId
 * 获取邀请详情
 */
router.get('/invitations/:invitationId', async (req, res) => {
    try {
        const { invitationId } = req.params;
        const invitation = await designatedMasterService_1.default.getInvitationDetail(invitationId);
        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: '邀请不存在'
            });
        }
        res.json({
            success: true,
            data: invitation
        });
    }
    catch (error) {
        logger_1.default.error('[邀请详情API] 错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取邀请详情失败'
        });
    }
});
/**
 * POST /api/v1/dispatch/invitations/expire
 * 手动触发过期邀请清理（管理员功能）
 */
router.post('/invitations/expire', async (req, res) => {
    try {
        const expiredCount = await designatedMasterService_1.default.expireOldInvitations();
        res.json({
            success: true,
            data: {
                expiredCount
            }
        });
    }
    catch (error) {
        logger_1.default.error('[过期邀请清理API] 错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '清理过期邀请失败'
        });
    }
});
exports.default = router;
//# sourceMappingURL=dispatch.js.map