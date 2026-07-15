"use strict";
/**
 * Phase 2.2: 资产仪表盘路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const abilityValuationService_1 = __importDefault(require("../services/abilityValuationService"));
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
/**
 * 获取学生的资产仪表盘
 * GET /api/v1/asset-dashboard
 */
router.get('/', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        logger_1.default.info('[AssetDashboard] 获取资产仪表盘', { userId });
        const dashboard = await abilityValuationService_1.default.generateDashboard(userId);
        res.json({
            success: true,
            data: dashboard
        });
    }
    catch (error) {
        logger_1.default.error('[AssetDashboard] 获取资产仪表盘失败:', error);
        next(error);
    }
});
/**
 * 获取能力价值详情
 * GET /api/v1/asset-dashboard/ability/:abilityName
 */
router.get('/ability/:abilityName', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { abilityName } = req.params;
        logger_1.default.info('[AssetDashboard] 获取能力价值详情', {
            userId,
            abilityName
        });
        // 获取完整仪表盘数据
        const dashboard = await abilityValuationService_1.default.generateDashboard(userId);
        // 找到指定能力
        const ability = dashboard.assets.find(a => a.abilityName === abilityName);
        if (!ability) {
            throw new errorHandler_1.AppError(404, '能力不存在');
        }
        res.json({
            success: true,
            data: {
                ability,
                trends: dashboard.trends // 包含趋势数据
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取市场价值对比
 * GET /api/v1/asset-dashboard/market-comparison
 */
router.get('/market-comparison', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        logger_1.default.info('[AssetDashboard] 获取市场对比', { userId });
        const dashboard = await abilityValuationService_1.default.generateDashboard(userId);
        res.json({
            success: true,
            data: {
                totalValue: dashboard.totalValue,
                marketComparison: dashboard.marketComparison,
                growthRate: dashboard.growthRate
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=assetDashboardRoutes.js.map