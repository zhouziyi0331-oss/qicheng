"use strict";
/**
 * AI智能定价控制器
 *
 * 处理AI智能定价相关的HTTP请求
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPricingSuggestion = getPricingSuggestion;
exports.savePricingHistory = savePricingHistory;
exports.recordAdjustment = recordAdjustment;
exports.getPricingAccuracy = getPricingAccuracy;
exports.updateBenchmarks = updateBenchmarks;
const aiPricingService_1 = __importDefault(require("../services/aiPricingService"));
const logger_1 = __importDefault(require("../utils/logger"));
// 扩展Request以包含user
// =====================================================
// 定价建议接口
// =====================================================
/**
 * 获取智能定价建议
 * POST /api/v1/ai-pricing/suggest
 */
async function getPricingSuggestion(req, res) {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 只有企业可以获取定价建议
        if (userRole !== 'company') {
            return res.status(403).json({ error: 'Only companies can get pricing suggestions' });
        }
        const { title, description, requirements, deliverables, category, difficulty_level, estimated_hours, required_abilities, deadline, } = req.body;
        if (!title || !description) {
            return res.status(400).json({ error: 'Missing required fields: title and description' });
        }
        const suggestion = await aiPricingService_1.default.getPricingSuggestion({
            title,
            description,
            requirements,
            deliverables,
            category,
            difficulty_level,
            estimated_hours,
            required_abilities,
            deadline: deadline ? new Date(deadline) : undefined,
            company_id: userId,
        });
        return res.json({
            success: true,
            data: suggestion,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get pricing suggestion', { error });
        return res.status(500).json({
            error: 'Failed to get pricing suggestion',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 保存定价历史（任务发布时调用）
 * POST /api/v1/ai-pricing/save-history
 */
async function savePricingHistory(req, res) {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (userRole !== 'company') {
            return res.status(403).json({ error: 'Only companies can save pricing history' });
        }
        const { task_id, suggestion, actual_min, actual_max } = req.body;
        if (!task_id || !suggestion || actual_min === undefined || actual_max === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const historyId = await aiPricingService_1.default.savePricingHistory(task_id, userId, suggestion, actual_min, actual_max);
        return res.json({
            success: true,
            data: {
                history_id: historyId,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to save pricing history', { error });
        return res.status(500).json({
            error: 'Failed to save pricing history',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 记录定价调整
 * POST /api/v1/ai-pricing/record-adjustment
 */
async function recordAdjustment(req, res) {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (userRole !== 'company') {
            return res.status(403).json({ error: 'Only companies can record adjustments' });
        }
        const { task_id, original_min, original_max, adjusted_min, adjusted_max, reason, note, } = req.body;
        if (!task_id ||
            original_min === undefined ||
            original_max === undefined ||
            adjusted_min === undefined ||
            adjusted_max === undefined ||
            !reason) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        await aiPricingService_1.default.recordPricingAdjustment(task_id, userId, original_min, original_max, adjusted_min, adjusted_max, reason, note);
        return res.json({
            success: true,
            message: 'Pricing adjustment recorded',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to record adjustment', { error });
        return res.status(500).json({
            error: 'Failed to record adjustment',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
// =====================================================
// 分析和统计接口
// =====================================================
/**
 * 获取定价准确度分析
 * GET /api/v1/ai-pricing/accuracy
 */
async function getPricingAccuracy(req, res) {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 只有管理员可以查看准确度分析
        if (userRole !== 'admin' && userRole !== 'platform') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const category = req.query.category;
        const difficulty = req.query.difficulty;
        const accuracy = await aiPricingService_1.default.getPricingAccuracy(category, difficulty);
        return res.json({
            success: true,
            data: accuracy,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get pricing accuracy', { error });
        return res.status(500).json({
            error: 'Failed to get pricing accuracy',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
/**
 * 手动更新市场基准价格（管理员）
 * POST /api/v1/ai-pricing/update-benchmarks
 */
async function updateBenchmarks(req, res) {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 只有管理员可以手动更新基准价格
        if (userRole !== 'admin' && userRole !== 'platform') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        await aiPricingService_1.default.updateMarketBenchmarks();
        return res.json({
            success: true,
            message: 'Market benchmarks updated successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to update benchmarks', { error });
        return res.status(500).json({
            error: 'Failed to update benchmarks',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=aiPricingController.js.map