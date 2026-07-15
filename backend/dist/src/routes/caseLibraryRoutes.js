"use strict";
/**
 * Phase 2.4: 案例库路由
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const caseLibraryService_1 = __importDefault(require("../services/caseLibraryService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * 搜索案例
 * GET /api/v1/case-library/search
 * Query params: caseType, category, difficulty, tags[], search, limit, offset
 */
router.get('/search', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const { caseType, category, difficulty, tags, search, limit, offset } = req.query;
        logger_1.default.info('[CaseLibrary] 搜索案例', {
            userId: req.user.userId,
            caseType,
            category,
            difficulty,
            search
        });
        const filter = {
            caseType: caseType,
            category: category,
            difficulty: difficulty ? parseInt(difficulty) : undefined,
            tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
            search: search,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        };
        const result = await caseLibraryService_1.default.searchCases(filter);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('[CaseLibrary] 搜索案例失败:', error);
        next(error);
    }
});
/**
 * 获取案例详情
 * GET /api/v1/case-library/cases/:caseId
 */
router.get('/cases/:caseId', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const { caseId } = req.params;
        logger_1.default.info('[CaseLibrary] 获取案例详情', {
            userId: req.user.userId,
            caseId
        });
        const caseData = await caseLibraryService_1.default.getCaseById(caseId);
        if (!caseData) {
            return res.status(404).json({
                success: false,
                message: '案例不存在'
            });
        }
        res.json({
            success: true,
            data: caseData
        });
    }
    catch (error) {
        logger_1.default.error('[CaseLibrary] 获取案例详情失败:', error);
        next(error);
    }
});
/**
 * 标记案例为有帮助
 * POST /api/v1/case-library/cases/:caseId/helpful
 */
router.post('/cases/:caseId/helpful', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const userId = req.user.userId;
        logger_1.default.info('[CaseLibrary] 标记案例有帮助', { userId, caseId });
        const success = await caseLibraryService_1.default.markCaseHelpful(caseId, userId);
        res.json({
            success,
            message: success ? '标记成功' : '已经标记过了'
        });
    }
    catch (error) {
        logger_1.default.error('[CaseLibrary] 标记案例有帮助失败:', error);
        next(error);
    }
});
/**
 * 获取案例统计
 * GET /api/v1/case-library/stats
 */
router.get('/stats', auth_1.authenticate, (0, auth_1.requireRole)('student'), async (req, res, next) => {
    try {
        logger_1.default.info('[CaseLibrary] 获取案例统计', { userId: req.user.userId });
        const stats = await caseLibraryService_1.default.getCaseStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.default.error('[CaseLibrary] 获取案例统计失败:', error);
        next(error);
    }
});
/**
 * 提取案例（管理员功能）
 * POST /api/v1/case-library/extract
 */
router.post('/extract', auth_1.authenticate, (0, auth_1.requireRole)('admin'), async (req, res, next) => {
    try {
        logger_1.default.info('[CaseLibrary] 开始提取案例', { userId: req.user.userId });
        const extractedCount = await caseLibraryService_1.default.extractCasesFromObservations();
        res.json({
            success: true,
            data: { extractedCount },
            message: `成功提取 ${extractedCount} 个案例`
        });
    }
    catch (error) {
        logger_1.default.error('[CaseLibrary] 提取案例失败:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=caseLibraryRoutes.js.map