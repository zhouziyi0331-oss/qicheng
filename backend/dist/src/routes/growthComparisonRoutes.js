"use strict";
/**
 * Phase 2.3: 成长对比路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const growthComparisonService_1 = __importDefault(require("../services/growthComparisonService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * 获取学生的成长对比数据
 * GET /api/v1/growth-comparison
 */
router.get('/', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        logger_1.default.info('[GrowthComparison] 获取成长对比', { userId });
        const comparison = await growthComparisonService_1.default.generateComparison(userId);
        res.json({
            success: true,
            data: comparison
        });
    }
    catch (error) {
        logger_1.default.error('[GrowthComparison] 获取成长对比失败:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=growthComparisonRoutes.js.map