"use strict";
/**
 * Phase 2.1: OPC身份卡片路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const opcIdentityCardService_1 = __importDefault(require("../services/opcIdentityCardService"));
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
/**
 * 生成身份卡片
 * POST /api/v1/opc/identity-cards
 */
router.post('/identity-cards', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { theme, includeStats } = req.body;
        logger_1.default.info('[OPCIdentityCard] 生成身份卡片', {
            userId,
            theme,
            includeStats
        });
        const card = await opcIdentityCardService_1.default.generateCard(userId, {
            theme,
            includeStats
        });
        res.json({
            success: true,
            data: card,
            message: '身份卡片生成成功'
        });
    }
    catch (error) {
        if (error.message === '未找到OPC测评结果') {
            next(new errorHandler_1.AppError(404, '请先完成OPC测评'));
        }
        else {
            next(error);
        }
    }
});
/**
 * 获取学生的身份卡片列表
 * GET /api/v1/opc/identity-cards
 */
router.get('/identity-cards', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { limit = '10' } = req.query;
        logger_1.default.info('[OPCIdentityCard] 获取身份卡片列表', {
            userId,
            limit
        });
        const cards = await opcIdentityCardService_1.default.getStudentCards(userId, parseInt(limit));
        res.json({
            success: true,
            data: {
                cards,
                total: cards.length
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取单个身份卡片（公开访问，用于分享）
 * GET /api/v1/opc/identity-cards/:cardId
 */
router.get('/identity-cards/:cardId', async (req, res, next) => {
    try {
        const { cardId } = req.params;
        const { incrementView = 'true' } = req.query;
        logger_1.default.info('[OPCIdentityCard] 获取身份卡片详情', {
            cardId,
            incrementView
        });
        const card = await opcIdentityCardService_1.default.getCardById(cardId, incrementView === 'true');
        if (!card) {
            throw new errorHandler_1.AppError(404, '身份卡片不存在');
        }
        res.json({
            success: true,
            data: card
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 删除身份卡片
 * DELETE /api/v1/opc/identity-cards/:cardId
 */
router.delete('/identity-cards/:cardId', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { cardId } = req.params;
        logger_1.default.info('[OPCIdentityCard] 删除身份卡片', {
            userId,
            cardId
        });
        const deleted = await opcIdentityCardService_1.default.deleteCard(cardId, userId);
        if (!deleted) {
            throw new errorHandler_1.AppError(404, '身份卡片不存在或无权删除');
        }
        res.json({
            success: true,
            message: '身份卡片已删除'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=opcIdentityCardRoutes.js.map