"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unifiedMentorController = exports.UnifiedMentorController = void 0;
const unifiedMentorService_1 = require("../services/unifiedMentorService");
class UnifiedMentorController {
    // 统一对话接口
    async chat(req, res) {
        try {
            const { message, session_id } = req.body;
            const userId = req.user.id;
            const response = await unifiedMentorService_1.unifiedMentorService.chat(userId, message, {
                session_id
            });
            res.json({
                success: true,
                data: response
            });
        }
        catch (err) {
            logger.error('对话失败:', err);
            res.status(500).json({
                success: false,
                error: '对话失败'
            });
        }
    }
    // 切换导师模式
    async switchMode(req, res) {
        try {
            const { mode } = req.body;
            const userId = req.user.id;
            if (!['emotional', 'project', 'hybrid', 'auto'].includes(mode)) {
                return res.status(400).json({
                    success: false,
                    error: '无效的导师模式'
                });
            }
            const result = await unifiedMentorService_1.unifiedMentorService.switchMode(userId, mode);
            res.json({
                success: true,
                data: result
            });
        }
        catch (err) {
            logger.error('切换模式失败:', err);
            res.status(500).json({
                success: false,
                error: '切换模式失败'
            });
        }
    }
    // 获取对话历史
    async getHistory(req, res) {
        try {
            const { session_id } = req.params;
            const { limit } = req.query;
            const userId = req.user.id;
            const history = await unifiedMentorService_1.unifiedMentorService.getConversationHistory(userId, session_id, limit ? parseInt(limit) : 20);
            res.json({
                success: true,
                data: history
            });
        }
        catch (err) {
            logger.error('获取历史失败:', err);
            res.status(500).json({
                success: false,
                error: '获取历史失败'
            });
        }
    }
    // 创建情感-项目关联
    async linkEmotionToProject(req, res) {
        try {
            const { emotional_data, project_id, link_type, transformation_story } = req.body;
            const userId = req.user.id;
            const link = await unifiedMentorService_1.unifiedMentorService.linkEmotionToProject(userId, emotional_data, project_id, link_type, transformation_story);
            res.json({
                success: true,
                data: link
            });
        }
        catch (err) {
            logger.error('创建关联失败:', err);
            res.status(500).json({
                success: false,
                error: '创建关联失败'
            });
        }
    }
    // 获取成长旅程
    async getGrowthJourney(req, res) {
        try {
            const userId = req.user.id;
            const journey = await unifiedMentorService_1.unifiedMentorService.getGrowthJourney(userId);
            res.json({
                success: true,
                data: journey
            });
        }
        catch (err) {
            logger.error('获取成长旅程失败:', err);
            res.status(500).json({
                success: false,
                error: '获取成长旅程失败'
            });
        }
    }
}
exports.UnifiedMentorController = UnifiedMentorController;
exports.unifiedMentorController = new UnifiedMentorController();
//# sourceMappingURL=unifiedMentorController.js.map