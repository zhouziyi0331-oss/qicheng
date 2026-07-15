"use strict";
/**
 * Phase 1.4: 升级通关仪式路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const levelUpCeremonyService_1 = __importDefault(require("../services/levelUpCeremonyService"));
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
/**
 * 获取学生的升级仪式历史
 * GET /api/v1/level-up/ceremonies
 */
router.get('/ceremonies', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { limit = '10' } = req.query;
        logger_1.default.info('[LevelUpCeremony] 获取升级仪式历史', {
            userId,
            limit
        });
        const ceremonies = await levelUpCeremonyService_1.default.getStudentCeremonies(userId, parseInt(limit));
        res.json({
            success: true,
            data: {
                ceremonies,
                total: ceremonies.length
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取单个升级仪式详情
 * GET /api/v1/level-up/ceremonies/:ceremonyId
 */
router.get('/ceremonies/:ceremonyId', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { ceremonyId } = req.params;
        logger_1.default.info('[LevelUpCeremony] 获取仪式详情', {
            userId,
            ceremonyId
        });
        const ceremony = await levelUpCeremonyService_1.default.getCeremonyById(ceremonyId);
        if (!ceremony) {
            throw new errorHandler_1.AppError(404, '仪式记录不存在');
        }
        // 确保只能查看自己的仪式
        if (ceremony.student_id !== userId) {
            throw new errorHandler_1.AppError(403, '无权查看此仪式');
        }
        res.json({
            success: true,
            data: ceremony
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 标记仪式已查看
 * POST /api/v1/level-up/ceremonies/:ceremonyId/viewed
 */
router.post('/ceremonies/:ceremonyId/viewed', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { ceremonyId } = req.params;
        logger_1.default.info('[LevelUpCeremony] 标记已查看', {
            userId,
            ceremonyId
        });
        const ceremony = await levelUpCeremonyService_1.default.getCeremonyById(ceremonyId);
        if (!ceremony) {
            throw new errorHandler_1.AppError(404, '仪式记录不存在');
        }
        if (ceremony.student_id !== userId) {
            throw new errorHandler_1.AppError(403, '无权操作此仪式');
        }
        // 更新查看状态
        const { query } = require('../utils/db');
        await query(`UPDATE level_up_ceremonies
         SET viewed = true, viewed_at = NOW()
         WHERE id = $1`, [ceremonyId]);
        res.json({
            success: true,
            message: '已标记为已查看'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 标记仪式已分享
 * POST /api/v1/level-up/ceremonies/:ceremonyId/shared
 */
router.post('/ceremonies/:ceremonyId/shared', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { ceremonyId } = req.params;
        logger_1.default.info('[LevelUpCeremony] 标记已分享', {
            userId,
            ceremonyId
        });
        const ceremony = await levelUpCeremonyService_1.default.getCeremonyById(ceremonyId);
        if (!ceremony) {
            throw new errorHandler_1.AppError(404, '仪式记录不存在');
        }
        if (ceremony.student_id !== userId) {
            throw new errorHandler_1.AppError(403, '无权操作此仪式');
        }
        // 更新分享状态
        const { query } = require('../utils/db');
        await query(`UPDATE level_up_ceremonies
         SET shared = true, shared_at = NOW()
         WHERE id = $1`, [ceremonyId]);
        res.json({
            success: true,
            message: '已标记为已分享'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=levelUpRoutes.js.map