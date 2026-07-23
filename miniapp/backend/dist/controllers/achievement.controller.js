"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.achievementController = exports.AchievementController = void 0;
const achievement_service_1 = require("../services/achievement.service");
/**
 * 成就系统控制器
 */
class AchievementController {
    /**
     * 获取用户成就列表
     * GET /api/achievements
     */
    async getUserAchievements(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const { isUnlocked, type } = req.query;
            const filter = {};
            if (isUnlocked !== undefined) {
                filter.isUnlocked = isUnlocked === 'true';
            }
            if (type) {
                filter.type = type;
            }
            const achievements = await achievement_service_1.achievementService.getUserAchievements(userId, filter);
            res.json({
                success: true,
                data: achievements,
                count: achievements.length
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '获取成就列表失败'
            });
        }
    }
    /**
     * 获取成就统计
     * GET /api/achievements/stats
     */
    async getAchievementStats(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const stats = await achievement_service_1.achievementService.getAchievementStats(userId);
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '获取成就统计失败'
            });
        }
    }
    /**
     * 检查并更新所有成就
     * POST /api/achievements/check
     */
    async checkAllAchievements(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const unlockedAchievements = await achievement_service_1.achievementService.checkAllAchievements(userId);
            res.json({
                success: true,
                data: unlockedAchievements,
                message: unlockedAchievements.length > 0
                    ? `恭喜解锁${unlockedAchievements.length}个新成就！`
                    : '暂无新成就解锁'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '检查成就失败'
            });
        }
    }
    /**
     * 切换成就展示状态
     * PUT /api/achievements/:achievementId/display
     */
    async toggleAchievementDisplay(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const { achievementId } = req.params;
            const achievement = await achievement_service_1.achievementService.toggleAchievementDisplay(userId, achievementId);
            res.json({
                success: true,
                data: achievement,
                message: '成就展示状态更新成功'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '更新成就展示状态失败'
            });
        }
    }
}
exports.AchievementController = AchievementController;
exports.achievementController = new AchievementController();
//# sourceMappingURL=achievement.controller.js.map