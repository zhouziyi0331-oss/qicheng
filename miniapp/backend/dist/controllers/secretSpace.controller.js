"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secretSpaceController = exports.SecretSpaceController = void 0;
const secretSpace_service_1 = require("../services/secretSpace.service");
/**
 * 小猫的秘密空间控制器
 */
class SecretSpaceController {
    /**
     * 获取秘密空间
     * GET /api/secret-space
     */
    async getSecretSpace(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const secretSpace = await secretSpace_service_1.secretSpaceService.getSecretSpace(userId);
            res.json({
                success: true,
                data: secretSpace
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '获取秘密空间失败'
            });
        }
    }
    /**
     * 签到
     * POST /api/secret-space/check-in
     */
    async checkIn(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const result = await secretSpace_service_1.secretSpaceService.checkIn(userId);
            res.json({
                success: true,
                data: result,
                message: result.reward
                    ? result.reward.message
                    : result.isConsecutive
                        ? `已连续签到${result.secretSpace.consecutiveDays}天！`
                        : '签到成功！'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '签到失败'
            });
        }
    }
    /**
     * 记录心情
     * POST /api/secret-space/mood
     */
    async recordMood(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const { mood, note, tags } = req.body;
            if (!mood || !note) {
                return res.status(400).json({
                    success: false,
                    message: '缺少必要参数'
                });
            }
            const secretSpace = await secretSpace_service_1.secretSpaceService.recordMood(userId, mood, note, tags);
            res.json({
                success: true,
                data: secretSpace,
                message: '心情记录成功'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '记录心情失败'
            });
        }
    }
    /**
     * 获取心情记录
     * GET /api/secret-space/mood
     */
    async getMoodRecords(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const { startDate, endDate } = req.query;
            const records = await secretSpace_service_1.secretSpaceService.getMoodRecords(userId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            res.json({
                success: true,
                data: records,
                count: records.length
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '获取心情记录失败'
            });
        }
    }
    /**
     * 添加私密笔记
     * POST /api/secret-space/notes
     */
    async addPrivateNote(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const { title, content, tags } = req.body;
            if (!title || !content) {
                return res.status(400).json({
                    success: false,
                    message: '缺少必要参数'
                });
            }
            const secretSpace = await secretSpace_service_1.secretSpaceService.addPrivateNote(userId, title, content, tags);
            res.json({
                success: true,
                data: secretSpace,
                message: '笔记添加成功'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '添加笔记失败'
            });
        }
    }
    /**
     * 更新私密笔记
     * PUT /api/secret-space/notes/:noteId
     */
    async updatePrivateNote(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const { noteId } = req.params;
            const updates = req.body;
            const secretSpace = await secretSpace_service_1.secretSpaceService.updatePrivateNote(userId, noteId, updates);
            res.json({
                success: true,
                data: secretSpace,
                message: '笔记更新成功'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '更新笔记失败'
            });
        }
    }
    /**
     * 删除私密笔记
     * DELETE /api/secret-space/notes/:noteId
     */
    async deletePrivateNote(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const { noteId } = req.params;
            const secretSpace = await secretSpace_service_1.secretSpaceService.deletePrivateNote(userId, noteId);
            res.json({
                success: true,
                data: secretSpace,
                message: '笔记删除成功'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '删除笔记失败'
            });
        }
    }
    /**
     * 添加个人里程碑
     * POST /api/secret-space/milestones
     */
    async addPersonalMilestone(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const { title, description, targetDate } = req.body;
            if (!title || !description) {
                return res.status(400).json({
                    success: false,
                    message: '缺少必要参数'
                });
            }
            const secretSpace = await secretSpace_service_1.secretSpaceService.addPersonalMilestone(userId, title, description, targetDate ? new Date(targetDate) : undefined);
            res.json({
                success: true,
                data: secretSpace,
                message: '里程碑添加成功'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '添加里程碑失败'
            });
        }
    }
    /**
     * 完成个人里程碑
     * PUT /api/secret-space/milestones/:milestoneId/complete
     */
    async completeMilestone(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const { milestoneId } = req.params;
            const secretSpace = await secretSpace_service_1.secretSpaceService.completeMilestone(userId, milestoneId);
            res.json({
                success: true,
                data: secretSpace,
                message: '恭喜完成里程碑！'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '完成里程碑失败'
            });
        }
    }
    /**
     * 添加名言收藏
     * POST /api/secret-space/quotes
     */
    async addFavoriteQuote(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const { text, author } = req.body;
            if (!text) {
                return res.status(400).json({
                    success: false,
                    message: '缺少必要参数'
                });
            }
            const secretSpace = await secretSpace_service_1.secretSpaceService.addFavoriteQuote(userId, text, author);
            res.json({
                success: true,
                data: secretSpace,
                message: '名言收藏成功'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '收藏名言失败'
            });
        }
    }
    /**
     * 更新空间设置
     * PUT /api/secret-space/settings
     */
    async updateSettings(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const settings = req.body;
            const secretSpace = await secretSpace_service_1.secretSpaceService.updateSettings(userId, settings);
            res.json({
                success: true,
                data: secretSpace,
                message: '设置更新成功'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '更新设置失败'
            });
        }
    }
    /**
     * 获取空间统计
     * GET /api/secret-space/stats
     */
    async getSpaceStats(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: '未授权' });
            }
            const stats = await secretSpace_service_1.secretSpaceService.getSpaceStats(userId);
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || '获取统计失败'
            });
        }
    }
}
exports.SecretSpaceController = SecretSpaceController;
exports.secretSpaceController = new SecretSpaceController();
//# sourceMappingURL=secretSpace.controller.js.map