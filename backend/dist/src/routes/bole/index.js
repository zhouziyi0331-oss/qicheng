"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const boleService_1 = __importDefault(require("../../services/boleService"));
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
/**
 * POST /api/bole/discover
 * 创建伯乐推荐
 */
router.post('/discover', auth_1.authenticate, async (req, res) => {
    try {
        const discovererId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以推荐学生',
            });
        }
        const { student_id, discovery_reason, recommended_skills, potential_rating } = req.body;
        if (!student_id || !discovery_reason) {
            return res.status(400).json({
                success: false,
                message: '缺少必填字段: student_id, discovery_reason',
            });
        }
        const discovery = await boleService_1.default.createDiscovery({
            discoverer_id: discovererId,
            student_id,
            discovery_reason,
            recommended_skills,
            potential_rating,
        });
        res.json({
            success: true,
            data: discovery,
            message: '推荐成功，感谢您发现优秀人才！',
        });
    }
    catch (error) {
        logger.error('创建推荐失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '创建推荐失败',
        });
    }
});
/**
 * GET /api/bole/discoveries
 * 获取推荐列表
 */
router.get('/discoveries', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        let discoveries;
        if (userRole === 'company') {
            discoveries = await boleService_1.default.getCompanyDiscoveries(userId);
        }
        else if (userRole === 'student') {
            discoveries = await boleService_1.default.getStudentDiscoveries(userId);
        }
        else {
            return res.status(403).json({
                success: false,
                message: '无权查看推荐列表',
            });
        }
        res.json({
            success: true,
            data: {
                discoveries,
                total: discoveries.length,
            },
        });
    }
    catch (error) {
        logger.error('获取推荐列表失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取推荐列表失败',
        });
    }
});
/**
 * GET /api/bole/discoveries/:id
 * 获取推荐详情
 */
router.get('/discoveries/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const discovery = await boleService_1.default.getDiscoveryById(id);
        res.json({
            success: true,
            data: discovery,
        });
    }
    catch (error) {
        logger.error('获取推荐详情失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取推荐详情失败',
        });
    }
});
/**
 * GET /api/bole/badges
 * 获取伯乐标签
 */
router.get('/badges', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以查看标签',
            });
        }
        const badges = await boleService_1.default.getBoleBadges(companyId);
        res.json({
            success: true,
            data: {
                badges,
                total: badges.length,
            },
        });
    }
    catch (error) {
        logger.error('获取标签失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取标签失败',
        });
    }
});
/**
 * POST /api/bole/check-badge
 * 检查并授予标签
 */
router.post('/check-badge', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以检查标签',
            });
        }
        const badge = await boleService_1.default.checkAndAwardBadge(companyId);
        if (badge) {
            res.json({
                success: true,
                data: badge,
                message: `恭喜！您获得了「${badge.badge_name}」标签！`,
            });
        }
        else {
            res.json({
                success: true,
                data: null,
                message: '暂未满足新标签条件',
            });
        }
    }
    catch (error) {
        logger.error('检查标签失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '检查标签失败',
        });
    }
});
/**
 * GET /api/bole/leaderboard
 * 获取伯乐排行榜
 */
router.get('/leaderboard', async (req, res) => {
    try {
        const { month } = req.query;
        const leaderboard = await boleService_1.default.getLeaderboard(month);
        res.json({
            success: true,
            data: {
                leaderboard,
                total: leaderboard.length,
            },
        });
    }
    catch (error) {
        logger.error('获取排行榜失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取排行榜失败',
        });
    }
});
/**
 * GET /api/bole/stats
 * 获取伯乐统计
 */
router.get('/stats', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以查看统计',
            });
        }
        const stats = await boleService_1.default.getCompanyBoleStats(companyId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        logger.error('获取伯乐统计失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取伯乐统计失败',
        });
    }
});
/**
 * GET /api/bole/reward-config
 * 获取奖励配置
 */
router.get('/reward-config', async (req, res) => {
    try {
        const config = await boleService_1.default.getRewardConfig();
        res.json({
            success: true,
            data: config,
        });
    }
    catch (error) {
        logger.error('获取奖励配置失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取奖励配置失败',
        });
    }
});
/**
 * POST /api/bole/discoveries/:id/validate
 * 手动验证推荐（管理员）
 */
router.post('/discoveries/:id/validate', auth_1.authenticate, async (req, res) => {
    try {
        const adminId = req.user.id;
        const userRole = req.user.role;
        const { id } = req.params;
        if (userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '只有管理员可以验证推荐',
            });
        }
        const discovery = await boleService_1.default.validateDiscovery(id, adminId);
        res.json({
            success: true,
            data: discovery,
            message: '验证成功',
        });
    }
    catch (error) {
        logger.error('验证推荐失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '验证推荐失败',
        });
    }
});
/**
 * GET /api/bole/student/:studentId/growth
 * 获取学生成长轨迹
 */
router.get('/student/:studentId/growth', auth_1.authenticate, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { months } = req.query;
        const growth = await boleService_1.default.getStudentGrowthTrack(studentId, months ? parseInt(months, 10) : 12);
        res.json({
            success: true,
            data: {
                growth,
                total: growth.length,
            },
        });
    }
    catch (error) {
        logger.error('获取成长轨迹失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取成长轨迹失败',
        });
    }
});
/**
 * GET /api/bole/recommended-students
 * 获取推荐候选学生
 */
router.get('/recommended-students', auth_1.authenticate, async (req, res) => {
    try {
        const companyId = req.user.id;
        const userRole = req.user.role;
        const { limit } = req.query;
        if (userRole !== 'company') {
            return res.status(403).json({
                success: false,
                message: '只有企业可以查看推荐',
            });
        }
        const students = await boleService_1.default.getRecommendedStudents(companyId, limit ? parseInt(limit, 10) : 10);
        res.json({
            success: true,
            data: {
                students,
                total: students.length,
            },
        });
    }
    catch (error) {
        logger.error('获取推荐学生失败:', error);
        res.status(500).json({
            success: false,
            message: error.message || '获取推荐学生失败',
        });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map