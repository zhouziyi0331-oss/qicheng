"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAddExp = exports.getLeaderboard = exports.getAllLevels = exports.getLevelInfo = void 0;
const level_service_1 = require("../services/level.service");
const logger_1 = require("../utils/logger");
/**
 * 等级控制器
 */
/**
 * GET /api/level/info
 * 获取用户等级信息
 */
const getLevelInfo = async (req, res) => {
    try {
        const userId = req.userId;
        const levelInfo = await level_service_1.levelService.getUserLevel(userId);
        res.json({
            success: true,
            data: levelInfo
        });
    }
    catch (error) {
        logger_1.log.error('获取等级信息失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getLevelInfo = getLevelInfo;
/**
 * GET /api/level/all
 * 获取所有等级配置
 */
const getAllLevels = async (req, res) => {
    try {
        const levels = level_service_1.levelService.getAllLevels();
        res.json({
            success: true,
            data: levels
        });
    }
    catch (error) {
        logger_1.log.error('获取等级配置失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getAllLevels = getAllLevels;
/**
 * GET /api/level/leaderboard
 * 获取等级榜单
 */
const getLeaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const leaderboard = await level_service_1.levelService.getLevelLeaderboard(limit);
        res.json({
            success: true,
            data: leaderboard
        });
    }
    catch (error) {
        logger_1.log.error('获取等级榜单失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.getLeaderboard = getLeaderboard;
/**
 * POST /api/level/test-add-exp
 * 测试：手动增加经验值（仅开发环境）
 */
const testAddExp = async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                error: '生产环境不可用'
            });
        }
        const userId = req.userId;
        const { exp, reason } = req.body;
        if (!exp || !reason) {
            return res.status(400).json({
                success: false,
                error: '缺少参数'
            });
        }
        const result = await level_service_1.levelService.addExp(userId, exp, reason);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.log.error('测试增加经验值失败', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
exports.testAddExp = testAddExp;
//# sourceMappingURL=level.controller.js.map