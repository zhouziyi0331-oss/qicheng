"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = __importDefault(require("../../utils/logger"));
const opcV2PersonalityService_1 = __importDefault(require("../services/opcV2PersonalityService"));
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
/**
 * 获取所有OPC测试题目
 * GET /api/v1/opc/questions
 */
router.get('/questions', async (req, res, next) => {
    try {
        const questions = await opcV2PersonalityService_1.default.getQuestions();
        res.json({
            success: true,
            data: {
                questions,
                totalCount: questions.length
            }
        });
    }
    catch (error) {
        logger_1.default.error('获取OPC题目失败:', error);
        next(error);
    }
});
/**
 * 提交OPC测试答案并获取分析结果
 * POST /api/v1/opc/submit-answers
 */
router.post('/submit-answers', auth_1.authenticate, [
    (0, express_validator_1.body)('answers').isArray({ min: 25, max: 25 }).withMessage('必须提交25道题的答案'),
    (0, express_validator_1.body)('answers.*.questionId').isUUID().withMessage('questionId必须是有效的UUID'),
    (0, express_validator_1.body)('answers.*.questionNumber').isInt({ min: 1, max: 25 }).withMessage('questionNumber必须在1-25之间'),
    (0, express_validator_1.body)('answers.*.dimension').isIn(['ai_tools', 'creative_preference', 'work_style', 'interest_direction']).withMessage('dimension无效'),
    (0, express_validator_1.body)('answers.*.answerValue').exists().withMessage('answerValue不能为空')
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const userId = req.user.userId;
        const { answers } = req.body;
        const result = await opcV2PersonalityService_1.default.submitAndAnalyze(userId, answers);
        res.json({
            success: true,
            data: {
                sessionId: result.sessionId,
                profile: result.analysisResult
            }
        });
    }
    catch (error) {
        logger_1.default.error('OPC分析失败:', error);
        next(error);
    }
});
/**
 * 获取用户最新的OPC分析结果
 * GET /api/v1/opc/profile
 */
router.get('/profile', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const profile = await opcV2PersonalityService_1.default.getLatestProfile(userId);
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: '尚未完成OPC测试'
            });
        }
        // 计算同类数据
        const samePersonalityCount = profile.samePersonalityCount || 0;
        const completionRate = samePersonalityCount > 0
            ? Math.round((profile.completedFirstOrderCount / samePersonalityCount) * 100)
            : 0;
        res.json({
            success: true,
            data: {
                profile: {
                    personalityType: profile.personality_type,
                    personalityTypeLabel: profile.personalityTypeLabel,
                    initialLevel: profile.initial_level,
                    levelReason: profile.level_reason,
                    trackRecommendation: profile.track_recommendation,
                    trackRecommendationLabel: profile.trackRecommendationLabel,
                    trackReason: profile.track_reason,
                    threeStrengths: profile.threeStrengths,
                    twoGaps: profile.twoGaps,
                    declaration: profile.declaration,
                    createdAt: profile.created_at
                },
                stats: {
                    samePersonalityCount,
                    completionRate,
                    message: `全国有${samePersonalityCount.toLocaleString()}个和你一样的「${profile.personalityTypeLabel}」。其中${completionRate}%已经在启程完成了第一单。`
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('获取OPC结果失败:', error);
        next(error);
    }
});
/**
 * 生成身份卡片
 * POST /api/v1/opc/generate-card
 */
router.post('/generate-card', auth_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const profile = await opcV2PersonalityService_1.default.getLatestProfile(userId);
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: '请先完成OPC测试'
            });
        }
        // TODO: 实现卡片生成逻辑（Canvas绘制 + 七牛云上传）
        // 暂时返回模拟数据
        const cardUrl = `https://cdn.qicheng.com/opc-cards/${userId}.png`;
        res.json({
            success: true,
            data: {
                cardUrl,
                personalityType: profile.personality_type,
                personalityTypeLabel: profile.personalityTypeLabel,
                level: profile.initial_level,
                declaration: profile.declaration.split('。')[0] // 取第一句作为卡片文案
            }
        });
    }
    catch (error) {
        logger_1.default.error('生成身份卡片失败:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=opcV2PersonalityRoutes.js.map