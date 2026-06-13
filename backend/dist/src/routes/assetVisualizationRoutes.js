"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = __importDefault(require("../../utils/logger"));
const assetVisualizationService_1 = __importDefault(require("../services/assetVisualizationService"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * 获取个人资产仪表盘
 * GET /api/v1/asset/dashboard
 */
router.get('/dashboard', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const dashboard = await assetVisualizationService_1.default.getDashboard(userId);
        res.json({
            success: true,
            data: dashboard
        });
    }
    catch (error) {
        logger_1.default.error('获取资产仪表盘失败:', error);
        next(error);
    }
});
/**
 * 生成成长对比卡片
 * POST /api/v1/asset/growth-comparison
 */
router.post('/growth-comparison', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { triggerType, currentTaskId } = req.body;
        if (!triggerType) {
            return res.status(400).json({
                success: false,
                message: 'triggerType不能为空'
            });
        }
        const card = await assetVisualizationService_1.default.generateGrowthComparisonCard(userId, triggerType, currentTaskId);
        res.json({
            success: true,
            data: card
        });
    }
    catch (error) {
        logger_1.default.error('生成成长对比卡片失败:', error);
        next(error);
    }
});
/**
 * 触发升级仪式
 * POST /api/v1/asset/level-up
 */
router.post('/level-up', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { fromLevel, toLevel } = req.body;
        if (!fromLevel || !toLevel) {
            return res.status(400).json({
                success: false,
                message: 'fromLevel和toLevel不能为空'
            });
        }
        const ceremony = await assetVisualizationService_1.default.generateLevelUpCeremony(userId, parseInt(fromLevel), parseInt(toLevel));
        res.json({
            success: true,
            data: ceremony
        });
    }
    catch (error) {
        logger_1.default.error('生成升级仪式失败:', error);
        next(error);
    }
});
/**
 * 获取成长对比卡片历史
 * GET /api/v1/asset/growth-history
 */
router.get('/growth-history', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { limit = 10 } = req.query;
        const { pool } = require('../config/database');
        const client = await pool.connect();
        try {
            const result = await client.query(`SELECT
           id,
           trigger_type,
           first_task_data,
           current_task_data,
           comparison_message,
           shared,
           created_at
         FROM growth_comparison_cards
         WHERE student_id = $1
         ORDER BY created_at DESC
         LIMIT $2`, [userId, parseInt(limit)]);
            res.json({
                success: true,
                data: {
                    cards: result.rows,
                    totalCount: result.rows.length
                }
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        logger_1.default.error('获取成长历史失败:', error);
        next(error);
    }
});
/**
 * 获取升级历史
 * GET /api/v1/asset/level-history
 */
router.get('/level-history', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { pool } = require('../config/database');
        const client = await pool.connect();
        try {
            const result = await client.query(`SELECT
           id,
           from_level,
           to_level,
           mentor_personal_message,
           unlocked_abilities,
           next_level_requirements,
           created_at
         FROM level_up_events
         WHERE student_id = $1
         ORDER BY created_at DESC`, [userId]);
            res.json({
                success: true,
                data: {
                    events: result.rows,
                    totalCount: result.rows.length
                }
            });
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        logger_1.default.error('获取升级历史失败:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=assetVisualizationRoutes.js.map