"use strict";
/**
 * AI定价API路由 - E-04功能
 * 提供智能定价建议
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const aiPricingService_1 = __importDefault(require("../../services/aiPricingService"));
const logger_1 = __importDefault(require("../../utils/logger"));
const router = (0, express_1.Router)();
/**
 * POST /api/tasks/ai-pricing
 * 计算AI定价建议
 */
router.post('/ai-pricing', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res) => {
    try {
        const { title, description, required_skills, difficulty, estimated_hours, task_type, urgency } = req.body;
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                error: 'title and description are required',
            });
        }
        const pricingResult = await aiPricingService_1.default.calculatePrice({
            title,
            description,
            required_skills,
            difficulty,
            estimated_hours,
            task_type,
            urgency,
        });
        res.json({
            success: true,
            data: pricingResult,
        });
    }
    catch (error) {
        logger_1.default.error('Error calculating AI pricing:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to calculate pricing',
        });
    }
});
/**
 * POST /api/tasks/:taskId/ai-pricing
 * 为已存在的任务计算定价
 */
router.post('/:taskId/ai-pricing', auth_1.authenticate, (0, auth_1.requireRole)('company'), async (req, res) => {
    try {
        const { taskId } = req.params;
        const { estimated_hours, urgency } = req.body;
        // TODO: 从数据库获取任务信息
        // 这里暂时使用请求体中的数据
        const taskFeatures = {
            title: req.body.title,
            description: req.body.description,
            required_skills: req.body.required_skills,
            difficulty: req.body.difficulty,
            estimated_hours,
            task_type: req.body.task_type,
            urgency,
        };
        const pricingResult = await aiPricingService_1.default.calculatePrice(taskFeatures);
        // 保存定价记录
        await aiPricingService_1.default.savePricingRecord(taskId, taskFeatures, pricingResult);
        res.json({
            success: true,
            data: pricingResult,
        });
    }
    catch (error) {
        logger_1.default.error('Error calculating task pricing:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to calculate pricing',
        });
    }
});
exports.default = router;
//# sourceMappingURL=ai-pricing.js.map