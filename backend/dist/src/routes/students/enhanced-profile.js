"use strict";
/**
 * 学生增强档案API路由 - E-05功能
 * 提供投资简报式的学生信息展示
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const studentProfileEnhancer_1 = __importDefault(require("../../services/studentProfileEnhancer"));
const logger_1 = __importDefault(require("../../utils/logger"));
const router = (0, express_1.Router)();
/**
 * GET /api/students/:studentId/enhanced-profile
 * 获取学生的增强档案（投资简报式）
 */
router.get('/:studentId/enhanced-profile', auth_1.authenticate, async (req, res) => {
    try {
        const { studentId } = req.params;
        const profile = await studentProfileEnhancer_1.default.generateEnhancedProfile(studentId);
        res.json({
            success: true,
            data: profile,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting enhanced profile:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get enhanced profile',
        });
    }
});
/**
 * POST /api/students/batch-enhanced-profiles
 * 批量获取学生增强档案
 */
router.post('/batch-enhanced-profiles', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res) => {
    try {
        const { studentIds } = req.body;
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'studentIds must be a non-empty array',
            });
        }
        if (studentIds.length > 20) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 20 students per batch',
            });
        }
        const profiles = await studentProfileEnhancer_1.default.batchGenerateProfiles(studentIds);
        // 转换为数组
        const profilesArray = Array.from(profiles.values());
        res.json({
            success: true,
            data: {
                profiles: profilesArray,
                total: profilesArray.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error getting batch enhanced profiles:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get batch profiles',
        });
    }
});
exports.default = router;
//# sourceMappingURL=enhanced-profile.js.map